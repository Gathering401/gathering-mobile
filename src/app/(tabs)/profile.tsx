import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { View, Text, ActivityIndicator } from 'react-native';
import dayjs from 'dayjs';
import { styles } from "../../styles/profile";
import {HeaderMenu} from "../../components/HeaderMenu";

const Profile = () => {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const loadUser = async () => {
            const stored = await SecureStore.getItemAsync('user');
            if (stored) setUser(JSON.parse(stored));
        }

        void loadUser();
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

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
                <Text style={styles.username}>{user.username}</Text>
            </View>
            <View style={styles.rows}>
                <View style={styles.row}>
                    <Text style={styles.rowLabel}>Email</Text>
                    <Text style={styles.rowValue}>{user.email}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.rowLabel}>Phone</Text>
                    <Text style={styles.rowValue}>{censoredPhone}</Text>
                </View>
                <View style={styles.row}>
                    <Text style={styles.rowLabel}>Zip code</Text>
                    <Text style={styles.rowValue}>{user.zipCode}</Text>
                </View>
                <View style={[styles.row, styles.rowLast]}>
                    <Text style={styles.rowLabel}>Birthdate</Text>
                    <Text style={styles.rowValue}>{formattedBirthdate}</Text>
                </View>
            </View>
        </View>
    );
};

export default Profile;
