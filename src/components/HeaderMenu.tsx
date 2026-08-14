import { useState } from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { styles } from '../styles/headerMenu';

export interface HeaderMenuItem {
    key: string;
    title: string;
    destructive?: boolean;
    onSelect: () => void;
}

export const HeaderMenu = ({ items }: { items: HeaderMenuItem[] }) => {
    const [open, setOpen] = useState(false);

    const handleSelect = (item: HeaderMenuItem) => {
        setOpen(false);
        setTimeout(() => {
            item.onSelect();
        }, 100);
    };

    return (
        <>
            <TouchableOpacity style={styles.iconButton} onPress={() => setOpen(true)}>
                <Ionicons name="menu-outline" size={24} color={colors.terracotta.primary} />
            </TouchableOpacity>
            <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
                <TouchableWithoutFeedback onPress={() => setOpen(false)}>
                    <View style={styles.overlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.menu}>
                                {items.map((item, index) => (
                                    <TouchableOpacity
                                        key={item.key}
                                        style={[styles.item, index < items.length - 1 && styles.itemBorder]}
                                        onPress={() => handleSelect(item)}
                                    >
                                        <Text style={item.destructive ? styles.itemTextDestructive : styles.itemText}>
                                            {item.title}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </>
    );
}
