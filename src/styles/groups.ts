import {StyleSheet} from "react-native";
import {colors} from "./colors";

export const styles = StyleSheet.create({
    container: {padding: 16},
    sectionTitle: {fontSize: 18, fontWeight: '500', marginBottom: 8, color: colors.terracotta.text},
    searchBar: {padding: 16},
    searchInput: {borderWidth: 1, borderColor: colors.sage.secondary, borderRadius: 8, padding: 10, fontSize: 16, color: colors.terracotta.text},
    divider: {height: 1, backgroundColor: colors.sage.lightFill, marginVertical: 16},
    emptyText: {textAlign: 'center', color: colors.sage.text, marginVertical: 8},
    errorText: {color: '#CC3333', marginVertical: 8},
    joinedGroupsList: {
        maxHeight: 250,
    },
});