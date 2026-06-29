import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import {
    View, Text, TouchableOpacity, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import {styles} from "../../styles/profile";

const Profile = () => {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const loadUser = async () => {
            const stored = await SecureStore.getItemAsync('user');
            if (stored) setUser(JSON.parse(stored));
        };
        loadUser();
    }, []);

    if (!user) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    const censoredPhone = `***-***-${user.phone.slice(-4)}`;
    const formattedBirthdate = dayjs(user.birthdate).format('MMMM DD, YYYY');

    const handleEdit = () => {
        router.push({
            pathname: '/signup',
            params: {
                isEdit: 'true',
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                birthdate: user.birthdate,
                phone: user.phone,
            }
        });
    };

    const handleLogout = async () => {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
        router.replace('/login');
    };

    return (
        <View style={styles.container}>
            <View style={styles.topActions}>
                <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                    <Ionicons name="pencil-outline" size={14} color="#228be6" />
                    <Text style={styles.editText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.editButton} onPress={() => router.push('/change-password')}>
                    <Ionicons name="lock-closed-outline" size={14} color="#228be6" />
                    <Text style={styles.editText}>Change Password</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out-outline" size={14} color="#fa5252" />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.title}>Profile</Text>
            <Text style={styles.username}>{user.username}</Text>
            <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
            <Text style={styles.field}>Email: {user.email}</Text>
            <Text style={styles.field}>Phone: {censoredPhone}</Text>
            <Text style={styles.field}>{formattedBirthdate}</Text>
        </View>
    );
};

export default Profile;
