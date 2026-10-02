import {useMemo, useRef, useState} from 'react';
import {StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';

type InterestSelectorProps = {
    interests: string[];
    value: string[];
    onValueChange: (interests: string[]) => void;
    contentItemsSize?: number;
    maxItemsSelect?: number;
};

export function TagSelector({
    interests,
    value,
    onValueChange,
    contentItemsSize = 76,
    maxItemsSelect = Number.POSITIVE_INFINITY,
}: InterestSelectorProps) {
    const [search, setSearch] = useState('');
    const searchInputRef = useRef<TextInput>(null);
    const isTouchingTagRef = useRef(false);

    const filteredInterests = useMemo(() => {
        const normalizedSearch = search.trim().toLowerCase();

        if (!normalizedSearch) {
            return interests;
        }

        return interests.filter((interest) =>
            interest.toLowerCase().includes(normalizedSearch)
        );
    }, [interests, search]);
    const availableInterests = filteredInterests.filter(
        (interest) => !value.includes(interest)
    );

    function toggleInterest(interest: string) {
        if (!value.includes(interest) && value.length >= maxItemsSelect) return;

        const nextInterests = value.includes(interest)
            ? value.filter((currentInterest) => currentInterest !== interest)
            : [...value, interest];

        onValueChange(nextInterests);
        searchInputRef.current?.focus();
        setTimeout(() => {
            isTouchingTagRef.current = false;
        }, 0);
    }

    function handleSearchBlur() {
        if (isTouchingTagRef.current) {
            return;
        }

        setSearch("");
    }

    function handleTagPressIn() {
        isTouchingTagRef.current = true;
    }

    return (
        <View style={styles.tagSelector}>
            <TextInput
                ref={searchInputRef}
                style={styles.searchInput}
                placeholder="Buscar etiquetas"
                value={search}
                onChangeText={setSearch}
                onBlur={handleSearchBlur}
            />

            {value.length > 0 && (
                <View style={styles.selectedTags}>
                    {value.map((interest) => (
                        <TouchableOpacity
                            key={interest}
                            style={[styles.tag, styles.selectedTag]}
                            onPressIn={handleTagPressIn}
                            onPress={() => toggleInterest(interest)}
                        >
                            <Text style={[styles.tagText, styles.selectedTagText]}>
                                {interest}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {Number.isFinite(maxItemsSelect) && (
                <View style={styles.textMaxSelect}>
                    <Text>{value.length + "/" + maxItemsSelect + " max."}</Text>
                </View>
            )}

            <View
                style={[
                    styles.tags,
                    !search && {maxHeight: contentItemsSize}
                ]}
            >
                {availableInterests.map((interest) => (
                    <TouchableOpacity
                        key={interest}
                        style={styles.tag}
                        onPressIn={handleTagPressIn}
                        onPress={() => toggleInterest(interest)}
                    >
                        <Text style={styles.tagText}>{interest}</Text>
                    </TouchableOpacity>
                ))}

                {filteredInterests.length === 0 && (
                    <Text style={styles.emptyText}>No hay etiquetas</Text>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    tagSelector: {
        marginTop: 10,
        marginBottom: 8,
        width: '90%',
    },
    searchInput: {
        backgroundColor: '#ffffff',
        borderColor: '#dce3dd',
        borderRadius: 8,
        borderWidth: 1,
        height: 40,
        padding: 10
    },
    selectedTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10
    },
    textMaxSelect: {
        alignItems: 'center',
        marginTop: 5,
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
        overflow: 'hidden',
        maxHeight: 76,
    },
    tag: {
        backgroundColor: '#ffffff',
        borderColor: '#dce3dd',
        borderRadius: 999,
        borderWidth: 1,
        paddingHorizontal: 12,
        paddingVertical: 7
    },
    selectedTag: {
        backgroundColor: '#20352b',
        borderColor: '#20352b'
    },
    tagText: {
        color: '#405348',
        fontSize: 13,
        fontWeight: '600'
    },
    selectedTagText: {
        color: '#ffffff'
    },
    emptyText: {
        color: '#65736a',
        fontSize: 13,
        marginTop: 2
    },
});
