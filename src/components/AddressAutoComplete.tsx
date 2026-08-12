import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useQuery } from '@tanstack/react-query';
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateUuid } from '../utils/uuid';
import { styles } from '../styles/address-autocomplete';

interface PlaceSuggestion {
    placeId: string;
    description: string;
}

interface AddressAutocompleteProps {
    initialValue?: string;
    disabled?: boolean;
    onSelect: (lat: number, lng: number, address: string) => void;
    onClear: () => void;
}

export interface AddressAutocompleteHandle {
    blur: () => void;
}

const AddressAutocomplete = forwardRef<AddressAutocompleteHandle, AddressAutocompleteProps>(
    ({ initialValue = '', disabled = false, onSelect, onClear }, ref) => {
        const inputRef = useRef<TextInput>(null);
        const [token, setToken] = useState<string | null>(null);
        const [text, setText] = useState(initialValue);
        const [debouncedText, setDebouncedText] = useState(initialValue);
        const [sessionToken, setSessionToken] = useState(generateUuid());
        const [showResults, setShowResults] = useState(false);

        useImperativeHandle(ref, () => ({
            blur: () => inputRef.current?.blur()
        }));

        useEffect(() => {
            SecureStore.getItemAsync('token').then(setToken);
        }, []);

        useEffect(() => {
            const timer = setTimeout(() => setDebouncedText(text), 300);
            return () => clearTimeout(timer);
        }, [text]);

        const authHeader = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        const { isFetching, data: suggestions = [] } = useQuery<PlaceSuggestion[]>({
            queryKey: ['place-autocomplete', debouncedText, sessionToken],
            enabled: !disabled && !!token && debouncedText.length > 2,
            queryFn: async () => {
                const params = new URLSearchParams({ input: debouncedText, sessionToken });

                const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/places/autocomplete?${params}`, {
                    method: 'GET',
                    headers: authHeader
                });

                return res.json();
            }
        });

        const handleSelect = async (suggestion: PlaceSuggestion) => {
            setText(suggestion.description);
            setShowResults(false);
            inputRef.current?.blur();

            const params = new URLSearchParams({ placeId: suggestion.placeId, sessionToken });

            const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/places/details?${params}`, {
                method: 'GET',
                headers: authHeader
            });

            const data = await res.json();

            onSelect(data.lat, data.lng, data.formattedAddress);
            setSessionToken(generateUuid());
        };

        const handleClear = () => {
            setText('');
            setDebouncedText('');
            setShowResults(false);
            onClear();
            setSessionToken(generateUuid());
        };

        return (
            <View style={styles.container}>
                <View style={disabled ? styles.inputRowDisabled : styles.inputRow}>
                    <TextInput
                        ref={inputRef}
                        style={disabled ? styles.inputDisabled : styles.input}
                        placeholder="Search for a location..."
                        value={text}
                        editable={!disabled}
                        onChangeText={(value) => {
                            setText(value);
                            setShowResults(true);
                        }}
                        onFocus={() => !disabled && setShowResults(true)}
                    />
                    {!disabled && isFetching && <ActivityIndicator style={styles.spinner} />}
                    {!disabled && !!text && !isFetching && (
                        <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                            <Ionicons name="close-circle" size={20} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
                {!disabled && showResults && suggestions.length > 0 && (
                    <View style={styles.resultsContainer}>
                        {suggestions.map((item) => (
                            <TouchableOpacity
                                key={item.placeId}
                                style={styles.resultItem}
                                onPress={() => handleSelect(item)}
                            >
                                <Text style={styles.resultText}>{item.description}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>
        );
    }
);

export { AddressAutocomplete }
