import { PayeeAnalysis } from "@/services/ynabService";

export interface PayeeGroup {
  id: string;
  payees: PayeeAnalysis[];
  similarity: number;
  suggestedName: string;
}

// ---------------------------------------------------------------------------
// Name normalisation
// ---------------------------------------------------------------------------

export function normalizePayeeName(name: string): string {
  let n = name.toLowerCase();

  // Strip trailing Amazon-style IDs like *A1B2C3
  n = n.replace(/\*[a-z0-9]+\s*$/i, "");

  // Strip trailing noise: #12345 or -789
  n = n.replace(/[#]\d+\s*$/, "");
  n = n.replace(/-\d+\s*$/, "");

  // Remove common corporate suffixes (word boundary, global)
  const suffixes = [
    "limited",
    "company",
    "gmbh",
    "sarl",
    "corp",
    "ltd",
    "inc",
    "sas",
    "plc",
    "pty",
    "s\\.a\\.",
    "co",
    "ag",
  ];
  const suffixRe = new RegExp(`\\b(${suffixes.join("|")})\\b`, "gi");
  n = n.replace(suffixRe, "");

  // Replace non-alphanumeric chars (keep accented French chars and spaces) with space
  n = n.replace(/[^a-z0-9àâäéèêëïîôùûüÿçœæ ]/g, " ");

  // Collapse whitespace and trim
  n = n.replace(/\s+/g, " ").trim();

  return n;
}

// ---------------------------------------------------------------------------
// Jaccard similarity on word tokens
// ---------------------------------------------------------------------------

function tokenize(normalized: string): string[] {
  return normalized.split(" ").filter((t) => t.length > 1);
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return intersection / union;
}

// ---------------------------------------------------------------------------
// Sørensen–Dice coefficient on character bigrams
// ---------------------------------------------------------------------------

function bigramCounts(s: string): Map<string, number> {
  const clean = s.replace(/ /g, "");
  const map = new Map<string, number>();
  for (let i = 0; i < clean.length - 1; i++) {
    const bg = clean[i] + clean[i + 1];
    map.set(bg, (map.get(bg) ?? 0) + 1);
  }
  return map;
}

function diceSimilarity(a: string, b: string): number {
  const bgA = bigramCounts(a);
  const bgB = bigramCounts(b);
  const totalA = [...bgA.values()].reduce((s, v) => s + v, 0);
  const totalB = [...bgB.values()].reduce((s, v) => s + v, 0);
  if (totalA === 0 && totalB === 0) return 1;
  if (totalA === 0 || totalB === 0) return 0;

  let intersection = 0;
  for (const [bg, count] of bgA) {
    intersection += Math.min(count, bgB.get(bg) ?? 0);
  }
  return (2 * intersection) / (totalA + totalB);
}

// ---------------------------------------------------------------------------
// Common prefix ratio
// ---------------------------------------------------------------------------

function commonPrefixRatio(a: string, b: string): number {
  const shorter = Math.min(a.length, b.length);
  if (shorter === 0) return 0;
  let len = 0;
  for (let i = 0; i < shorter; i++) {
    if (a[i] === b[i]) len++;
    else break;
  }
  return len / shorter;
}

// ---------------------------------------------------------------------------
// Composite similarity score (0–100)
// ---------------------------------------------------------------------------

export function payeeSimilarity(name1: string, name2: string): number {
  const n1 = normalizePayeeName(name1);
  const n2 = normalizePayeeName(name2);

  if (n1 === n2) return 100;
  if (n1.length < 3 || n2.length < 3) return 0;

  const jaccard = jaccardSimilarity(n1, n2);
  const dice = diceSimilarity(n1, n2);
  const prefix = commonPrefixRatio(n1, n2);

  const weighted = jaccard * 0.4 + dice * 0.35 + prefix * 0.25;

  // Containment bonus: +15 if one normalised name fully contains the other
  let bonus = 0;
  if (n1.length >= 4 && n2.length >= 4 && (n1.includes(n2) || n2.includes(n1))) {
    bonus = 15;
  }

  return Math.min(100, Math.round(weighted * 100) + bonus);
}

// ---------------------------------------------------------------------------
// Union-Find (for transitive grouping)
// ---------------------------------------------------------------------------

class UnionFind {
  private parent = new Map<string, string>();

  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x);
    const p = this.parent.get(x)!;
    if (p !== x) {
      const root = this.find(p);
      this.parent.set(x, root);
      return root;
    }
    return p;
  }

  union(x: string, y: string): void {
    const px = this.find(x);
    const py = this.find(y);
    if (px !== py) this.parent.set(px, py);
  }
}

// ---------------------------------------------------------------------------
// Grouping engine
// ---------------------------------------------------------------------------

export function groupPayees(payees: PayeeAnalysis[], threshold: number): PayeeGroup[] {
  const active = payees.filter(
    (p) =>
      p.transactionCount > 0 &&
      !p.name.toLowerCase().startsWith("transfer :") &&
      !p.name.toLowerCase().startsWith("transfer:")
  );

  const uf = new UnionFind();
  // Cache pairwise similarity scores to avoid recomputation
  const simCache = new Map<string, number>();

  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const sim = payeeSimilarity(active[i].name, active[j].name);
      if (sim >= threshold) {
        uf.union(active[i].id, active[j].id);
        const key = [active[i].id, active[j].id].sort().join("|");
        simCache.set(key, sim);
      }
    }
  }

  // Collect members per group root
  const groupMap = new Map<string, PayeeAnalysis[]>();
  for (const p of active) {
    const root = uf.find(p.id);
    if (!groupMap.has(root)) groupMap.set(root, []);
    groupMap.get(root)!.push(p);
  }

  const groups: PayeeGroup[] = [];

  for (const members of groupMap.values()) {
    if (members.length < 2) continue;

    // Suggested name = payee with the highest transactionCount
    const suggested = members.reduce((prev, cur) =>
      cur.transactionCount > prev.transactionCount ? cur : prev
    );

    // Average pairwise similarity
    let simSum = 0;
    let simCount = 0;
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const key = [members[i].id, members[j].id].sort().join("|");
        // Use cached value when available (pairs that triggered the union);
        // for transitive pairs compute on the fly.
        simSum += simCache.get(key) ?? payeeSimilarity(members[i].name, members[j].name);
        simCount++;
      }
    }
    const avgSimilarity = simCount > 0 ? Math.round(simSum / simCount) : threshold;

    groups.push({
      id: `group-${suggested.id}`,
      payees: members,
      similarity: avgSimilarity,
      suggestedName: suggested.name,
    });
  }

  // Sort by combined total amount descending
  return groups.sort((a, b) => {
    const aTotal = a.payees.reduce((s, p) => s + p.totalAmount, 0);
    const bTotal = b.payees.reduce((s, p) => s + p.totalAmount, 0);
    return bTotal - aTotal;
  });
}
