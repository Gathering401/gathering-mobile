import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useQuery } from '@tanstack/react-query';
import { Calendar } from 'react-native-calendars';
import {
    View, Text, TouchableOpacity, ScrollView,
    StyleSheet, ActivityIndicator
} from 'react-native';
import dayjs from 'dayjs';

interface CalendarEvent {
    id: number;
    name: string;
    description: string;
    date: string;
    groupId: number;
    groupName: string;
}

const Main = () => {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));

    useEffect(() => {
        SecureStore.getItemAsync('token').then(setToken);
    }, []);

    const { isLoading, data: events = [] } = useQuery<CalendarEvent[]>({
        queryKey: ['events-all'],
        enabled: !!token,
        queryFn: async () => {
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/event/all`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) return data.response;
            throw new Error(data.error);
        }
    });

    // Build date → events lookup map
    const eventsByDate = events.reduce<Record<string, CalendarEvent[]>>((acc, event) => {
        const key = dayjs(event.date).format('YYYY-MM-DD');
        if (!acc[key]) acc[key] = [];
        acc[key].push(event);
        return acc;
    }, {});

    // Build marked dates for the calendar
    const markedDates = Object.keys(eventsByDate).reduce<Record<string, any>>((acc, key) => {
        acc[key] = {
            marked: true,
            dotColor: '#228be6',
            selected: key === selectedDate,
            selectedColor: '#228be6',
        };
        return acc;
    }, {});

    // Make sure selected date is always marked even if no events
    if (!markedDates[selectedDate]) {
        markedDates[selectedDate] = { selected: true, selectedColor: '#228be6' };
    } else {
        markedDates[selectedDate].selected = true;
        markedDates[selectedDate].selectedColor = '#228be6';
    }

    const selectedEvents = (eventsByDate[selectedDate] ?? [])
        .slice()
        .sort((a, b) => dayjs(a.date).diff(dayjs(b.date)));

    const formattedSelected = dayjs(selectedDate).format('MMMM D, YYYY');

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {isLoading ? (
                <ActivityIndicator size="large" style={{ marginTop: 40 }} />
            ) : (
                <>
                    <Calendar
                        current={selectedDate}
                        onDayPress={(day) => setSelectedDate(day.dateString)}
                        markedDates={markedDates}
                        theme={{
                            todayTextColor: '#228be6',
                            selectedDayBackgroundColor: '#228be6',
                            dotColor: '#228be6',
                            arrowColor: '#228be6',
                        }}
                    />

                    <Text style={styles.dateTitle}>{formattedSelected}</Text>

                    {selectedEvents.length === 0 ? (
                        <Text style={styles.emptyText}>No events on {formattedSelected}</Text>
                    ) : (
                        selectedEvents.map((event) => (
                            <TouchableOpacity
                                key={event.id}
                                style={styles.card}
                                onPress={() => router.push({
                                    pathname: `/event/${event.id}`,
                                    params: { groupId: String(event.groupId) }
                                })}
                            >
                                <Text style={styles.cardTitle}>{event.name}</Text>
                                <Text style={styles.cardGroup}>{event.groupName}</Text>
                                <Text style={styles.cardTime}>{dayjs(event.date).format('h:mm A')}</Text>
                            </TouchableOpacity>
                        ))
                    )}
                </>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { paddingBottom: 40 },
    dateTitle: { fontSize: 18, fontWeight: '600', textAlign: 'center', marginTop: 12, marginBottom: 8 },
    emptyText: { textAlign: 'center', color: '#888', marginTop: 8 },
    card: { marginHorizontal: 16, marginBottom: 8, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, backgroundColor: '#fff' },
    cardTitle: { fontSize: 15, fontWeight: '600' },
    cardGroup: { fontSize: 13, color: '#666', marginTop: 2 },
    cardTime: { fontSize: 13, color: '#444', marginTop: 2 },
});

export default Main;