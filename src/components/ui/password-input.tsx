import * as React from "react"
import { Eye, EyeOff, Lock, Check, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export interface PasswordInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    showStrength?: boolean
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
    ({ className, showStrength, value, onChange, ...props }, ref) => {
        const [showPassword, setShowPassword] = React.useState(false)
        const [strength, setStrength] = React.useState(0)

        // Simple password strength calculation
        React.useEffect(() => {
            if (!value) {
                setStrength(0);
                return;
            }
            const val = String(value);
            let score = 0;
            if (val.length > 7) score++;
            if (val.match(/[A-Z]/)) score++;
            if (val.match(/[0-9]/)) score++;
            if (val.match(/[^A-Za-z0-9]/)) score++;
            setStrength(score);
        }, [value]);

        return (
            <div className="space-y-2">
                <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                    <Input
                        type={showPassword ? "text" : "password"}
                        className={cn("pl-12 pr-10 h-12 rounded-xl transition-all", className)}
                        ref={ref}
                        value={value}
                        onChange={onChange}
                        {...props}
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        {showPassword ? (
                            <EyeOff className="h-5 w-5" aria-hidden="true" />
                        ) : (
                            <Eye className="h-5 w-5" aria-hidden="true" />
                        )}
                        <span className="sr-only">
                            {showPassword ? "Hide password" : "Show password"}
                        </span>
                    </button>
                </div>

                {showStrength && value && (
                    <div className="flex gap-1 h-1 mt-2">
                        {[1, 2, 3, 4].map((level) => (
                            <div
                                key={level}
                                className={cn(
                                    "h-full flex-1 rounded-full transition-colors duration-300",
                                    strength >= level
                                        ? strength < 2 ? "bg-red-500" : strength < 3 ? "bg-yellow-500" : "bg-green-500"
                                        : "bg-muted"
                                )}
                            />
                        ))}
                    </div>
                )}
                {showStrength && value && (
                    <p className="text-xs text-muted-foreground text-right">
                        {strength < 2 ? "Weak" : strength < 3 ? "Medium" : "Strong"} password
                    </p>
                )}
            </div>
        )
    }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
