
import { useAuth } from '../components/AuthContext';

// ATENÇÃO: Verificação de Super Admin agora é feita por e-mail para evitar problemas entre projetos Firebase.
const SUPER_ADMIN_EMAIL = 'luicarods@gmail.com'; 

export const useSuperAdmin = (): boolean => {
    const { currentUser } = useAuth();
    
    if (!currentUser || !currentUser.email) {
        return false;
    }

    return currentUser.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
};
