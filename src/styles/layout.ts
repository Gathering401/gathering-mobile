import {colors} from "./colors";
import {StyleSheet} from "react-native";

export const styles = StyleSheet.create({
    newEvent: {
        margin: 0,
        padding: 0,
        width: 34,
        height: 34,
        borderRadius: 17,
        borderWidth: 1.5,
        borderColor: colors.terracotta.primary,
        backgroundColor: 'transparent',
        justifyContent: 'center',
        alignItems: 'center'
    },
    loader: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});
