import {Icon} from '@/components/ui/icon';
import {Check, X} from 'lucide-react-native';
import {useMemo, useState} from 'react';
import {ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';

export type SelectOption = {
    label: string;
    value: string;
};

type SelectComponentProps = {
    options: SelectOption[];
    value: SelectOption[];
    placeholder?: string;
    onValueChange?: (options: SelectOption[]) => void;
    contentItemsSize?: number;
    maxItemsSelect?: number;
    optionsLayout?: 'chips' | 'list';
};

const SELECTED_LABEL_MAX_LENGTH = 10;

function getShortLabel(label: string) {
    if (label.length <= SELECTED_LABEL_MAX_LENGTH) {
        return label;
    }

    return `${label.slice(0, SELECTED_LABEL_MAX_LENGTH - 3)}...`;
}

export function SelectComponent({
    options,
    value,
    placeholder = 'Buscar opciones',
    onValueChange,
    contentItemsSize = 150,
    maxItemsSelect = 10000,
    optionsLayout = 'chips',
}: SelectComponentProps) {
    const [search, setSearch] = useState('');

    const selectedValues = useMemo(
        () => new Set(value.map((option) => option.value)),
        [value],
    );

    const filteredOptions = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        if (!normalizedSearch) {
            return options;
        }

        return options.filter((option) =>
            option.label.toLowerCase().includes(normalizedSearch)
        );
    }, [options, search]);

    function toggleOption(option: SelectOption) {
        if (!selectedValues.has(option.value) && value.length >= maxItemsSelect) return;

        const nextOptions = selectedValues.has(option.value)
            ? value.filter((currentOption) => currentOption.value !== option.value)
            : [...value, option];

        onValueChange?.(nextOptions);
    }

    return (
        <View style={styles.selector}>
            <View style={styles.searchBox}>
                {value.map((option) => (
                    <View key={option.value} style={styles.selectedChip}>
                        <Text style={styles.selectedChipText} numberOfLines={1}>
                            {getShortLabel(option.label)}
                        </Text>
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => toggleOption(option)}
                            style={styles.removeButton}
                        >
                            <Icon as={X} color="#ffffff" size={12} />
                        </TouchableOpacity>
                    </View>
                ))}

                <TextInput
                    style={styles.searchInput}
                    placeholder={value.length === 0 ? placeholder : ''}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {filteredOptions.length >= maxItemsSelect && (
                <View style={styles.textMaxSelect}>
                    <Text>{value.length+"/"+maxItemsSelect+" max."}</Text>
                </View>
            )}

            <View style={[styles.optionsViewport, {height: contentItemsSize}]}>
                <ScrollView
                    style={styles.optionsScroll}
                    contentContainerStyle={[
                        styles.options,
                        optionsLayout === 'list' && styles.listOptions,
                    ]}
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                    scrollEnabled
                    showsVerticalScrollIndicator
                >
                    {filteredOptions.map((option) => {
                        const isSelected = selectedValues.has(option.value);

                        return (
                            <TouchableOpacity
                                key={option.value}
                                activeOpacity={0.78}
                                style={[
                                    styles.option,
                                    optionsLayout === 'list' && styles.listOption,
                                    isSelected && styles.selectedOption,
                                ]}
                                onPress={() => toggleOption(option)}
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        isSelected && styles.selectedOptionText,
                                    ]}
                                >
                                    {option.label}
                                </Text>
                                {isSelected && (
                                    <Icon as={Check} color="#ffffff" size={16} />
                                )}
                            </TouchableOpacity>
                        );
                    })}

                    {filteredOptions.length === 0 && (
                        <Text style={styles.emptyText}>No hay opciones</Text>
                    )}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    selector: {
        marginTop: 10,
        width: '100%',
    },
    textMaxSelect: {
        marginTop: 5,
        alignItems: 'center'
    },
    searchBox: {
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderColor: '#dce3dd',
        borderRadius: 8,
        borderWidth: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        minHeight: 42,
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    searchInput: {
        color: '#111814',
        flex: 1,
        fontSize: 14,
        minHeight: 28,
        minWidth: 120,
        padding: 0,
    },
    selectedChip: {
        alignItems: 'center',
        backgroundColor: '#20352b',
        borderRadius: 999,
        flexDirection: 'row',
        gap: 4,
        maxWidth: 118,
        paddingLeft: 10,
        paddingRight: 5,
        paddingVertical: 5,
    },
    selectedChipText: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '800',
        maxWidth: 76,
    },
    removeButton: {
        alignItems: 'center',
        borderRadius: 999,
        height: 18,
        justifyContent: 'center',
        width: 18,
    },
    optionsViewport: {
        flexGrow: 0,
        marginTop: 8,
        overflow: 'hidden',
        width: '100%',
    },
    optionsScroll: {
        flex: 1,
        minHeight: 0,
        paddingRight: 4,
        width: '100%',
    },
    options: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        paddingBottom: 2,
    },
    listOptions: {
        flexDirection: 'column',
    },
    option: {
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderColor: '#dce3dd',
        borderRadius: 999,
        borderWidth: 1,
        flexDirection: 'row',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },
    listOption: {
        justifyContent: 'space-between',
        width: '100%',
    },
    selectedOption: {
        backgroundColor: '#20352b',
        borderColor: '#20352b',
    },
    optionText: {
        color: '#405348',
        fontSize: 13,
        fontWeight: '600',
    },
    selectedOptionText: {
        color: '#ffffff',
    },
    emptyText: {
        color: '#65736a',
        fontSize: 13,
        marginTop: 2,
    },
});
