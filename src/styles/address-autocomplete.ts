import {StyleSheet} from 'react-native';
import {colors} from './colors';

export const styles = StyleSheet.create({
    container: {
        position: 'relative',
        zIndex: 10
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        borderWidth: 1,
        borderColor: colors.sage.secondary,
        borderRadius: 8,
        backgroundColor: 'transparent',
        paddingHorizontal: 12
    },
    inputRowDisabled: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        borderWidth: 1,
        borderColor: colors.sage.secondary,
        borderRadius: 8,
        backgroundColor: colors.terracotta.lightFill,
        paddingHorizontal: 12
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: '#000'
    },
    inputDisabled: {
        flex: 1,
        height: '100%',
        fontSize: 16,
        color: colors.terracotta.secondary
    },
    spinner: {
        marginLeft: 8
    },
    clearButton: {
        marginLeft: 8,
        padding: 4
    },
    resultsContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderTopWidth: 0,
        borderBottomLeftRadius: 8,
        borderBottomRightRadius: 8,
        backgroundColor: '#fff',
        maxHeight: 180
    },
    resultItem: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.terracotta.lightFill
    },
    resultText: {
        fontSize: 15,
        color: colors.terracotta.text
    }
});
