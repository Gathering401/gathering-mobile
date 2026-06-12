import {StyleSheet} from "react-native";

export const styles = StyleSheet.create({
    container: {flexGrow: 1, justifyContent: 'center', padding: 24},
    title: {fontSize: 28, fontWeight: '700', marginBottom: 24},
    fieldContainer: {marginBottom: 16},
    label: {fontSize: 14, fontWeight: '500', marginBottom: 4},
    input: {borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, fontSize: 16},
    button: {backgroundColor: '#228be6', borderRadius: 8, padding: 14, alignItems: 'center', marginTop: 8},
    buttonText: {color: '#fff', fontWeight: '600', fontSize: 16},
    link: {marginTop: 16, textAlign: 'center', color: '#228be6'},
    inputDisabled: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        backgroundColor: '#f0f0f0',
        color: '#aaa'
    },
});