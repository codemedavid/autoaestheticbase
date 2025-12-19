import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogIn, Lock, AlertCircle } from 'lucide-react';
import './AdminLogin.css';

interface AdminLoginProps {
    onSuccess?: () => void;
}

export function AdminLogin({ onSuccess }: AdminLoginProps) {
    const { signIn } = useAuth();
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            // Using a placeholder email since we're using password-only login
            // The actual auth logic in useAuth will handle the 'Admin123@' password check
            const { error } = await signIn('admin@autoaesthetic.com', password);
            if (error) {
                setError(error);
            } else {
                onSuccess?.();
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login">
            <div className="admin-login-container">
                <div className="admin-login-header">
                    <div className="admin-login-icon">
                        <LogIn size={32} />
                    </div>
                    <h1>Admin Login</h1>
                    <p>Enter your password to continue</p>
                </div>

                <form onSubmit={handleSubmit} className="admin-login-form">
                    {error && (
                        <div className="admin-login-error">
                            <AlertCircle size={18} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label" htmlFor="password">Password</label>
                        <div className="input-with-icon">
                            <Lock size={18} className="input-icon" />
                            <input
                                id="password"
                                type="password"
                                className="form-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg w-full"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner" />
                                Signing in...
                            </>
                        ) : (
                            <>
                                <LogIn size={18} />
                                Sign In
                            </>
                        )}
                    </button>
                </form>

                <div className="admin-login-footer">
                    <p>Forgot your password? Contact your system administrator.</p>
                </div>
            </div>
        </div>
    );
}
