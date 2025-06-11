import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";
import { Sun, Moon, Database, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";

interface HeaderProps {
  onDashboardToggle: () => void;
}

export function Header({ onDashboardToggle }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const [showTimer, setShowTimer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  const startValidationTimer = () => {
    setShowTimer(true);
    setTimeLeft(60);
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowTimer(false);
          // Show completion message
          setTimeout(() => {
            alert("Validation completed successfully! Process validation executed.");
          }, 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    // Listen for validation start event
    const handleValidationStart = () => startValidationTimer();
    window.addEventListener('startValidation', handleValidationStart);
    
    return () => {
      window.removeEventListener('startValidation', handleValidationStart);
    };
  }, []);

  return (
    <header className="bg-background border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Database className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Duke Energy Data Products Testing</h1>
              <p className="text-sm text-muted-foreground">JSON Creator & Validation Suite</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Timer Display */}
            {showTimer && (
              <div className="flex items-center space-x-2 bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full">
                <div className="w-6 h-6 relative">
                  <svg className="w-6 h-6 -rotate-90" viewBox="0 0 36 36">
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="3"
                      strokeOpacity="0.3"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="16"
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="3"
                      strokeDasharray="100"
                      strokeDashoffset={100 - (timeLeft / 60) * 100}
                      strokeLinecap="round"
                      className="transition-all duration-1000"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  Validating... {timeLeft}s
                </span>
              </div>
            )}
            
            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            {/* Dashboard Toggle */}
            <Button onClick={onDashboardToggle} className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
