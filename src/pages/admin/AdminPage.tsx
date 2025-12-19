import { useAuth } from '../../hooks/useAuth';
import { AdminLogin } from '../../components/admin/AdminLogin';
import { AdminDashboard } from '../../components/admin/AdminDashboard';

export function AdminPage() {
    const { user, isAdmin: _isAdmin, loading } = useAuth();

    if (loading) {
        return (
            <div className="admin-loading">
                <span className="spinner"></span>
                <span>Loading...</span>
            </div>
        );
    }

    if (!user) {
        return <AdminLogin />;
    }

    // For development, allow any logged in user to access admin
    // In production, uncomment the isAdmin check below
    // if (!isAdmin) {
    //   return (
    //     <div className="admin-unauthorized">
    //       <h1>Access Denied</h1>
    //       <p>You don't have permission to access the admin panel.</p>
    //     </div>
    //   );
    // }

    return <AdminDashboard />;
}
