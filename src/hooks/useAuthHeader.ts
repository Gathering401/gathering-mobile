import * as SecureStore from 'expo-secure-store';
import { useState, useEffect } from 'react';

export const useAuthHeader = () => {
    const [authHeader, setAuthHeader] = useState<Record<string, string>>({});

    useEffect(() => {
        SecureStore.getItemAsync('token').then(token => {
            setAuthHeader({
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            });
        });
    }, []);

    return authHeader;
}
