
import { cn } from "@/lib/utils";
import Header from "./Header";
import Footer from "./Footer";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout = ({ children, className }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className={cn("flex-1 container mx-auto p-4 md:p-6", className)}>
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
