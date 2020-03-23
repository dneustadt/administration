import './sw-import-export-entity-path-select.scss';
import template from './sw-import-export-entity-path-select.html.twig';

const { Component, Mixin } = Shopware;
const { debounce, get } = Shopware.Utils;

Component.register('sw-import-export-entity-path-select', {
    template,

    model: {
        prop: 'value',
        event: 'change'
    },

    mixins: [
        Mixin.getByName('remove-api-error')
    ],

    props: {
        value: {
            required: true
        },
        entityType: {
            type: String,
            required: true
        },
        isLoading: {
            type: Boolean,
            required: false,
            default: false
        },
        highlightSearchTerm: {
            type: Boolean,
            required: false,
            default: true
        },
        placeholder: {
            type: String,
            required: false,
            default: ''
        },
        labelProperty: {
            type: String,
            required: false,
            default: 'label'
        },
        valueProperty: {
            type: String,
            required: false,
            default: 'value'
        },

        /**
         * @deprecated tag:v6.3.0
         */
        popoverConfig: {
            type: Object,
            required: false,
            default() {
                return { active: false };
            }
        },

        // Used to implement a custom search function.
        // Parameters passed: { options, labelProperty, valueProperty, searchTerm }
        searchFunction: {
            type: Function,
            required: false,
            default({ options, labelProperty, searchTerm }) {
                return options.filter(option => {
                    const label = this.getKey(option, labelProperty);
                    if (!label) {
                        return false;
                    }
                    return label.toLowerCase().includes(searchTerm.toLowerCase());
                });
            }
        }
    },

    data() {
        return {
            searchTerm: '',
            actualSearch: '',
            isExpanded: false,
            // used to track if an item was selected before closing the result list
            itemRecentlySelected: false
        };
    },

    computed: {
        currentValue: {
            get() {
                return this.value || '';
            },
            set(newValue) {
                /** @deprecated tag:v6.3.0 Html select don't have an onInput event */
                this.$emit('input', newValue);
                this.$emit('change', newValue);
            }
        },

        inputClasses() {
            return {
                'is--expanded': this.isExpanded
            };
        },

        selectionTextClasses() {
            return {
                'is--placeholder': !this.singleSelection
            };
        },

        singleSelection: {
            get() {
                return this.results.find(option => {
                    return this.getKey(option, this.valueProperty) === this.currentValue;
                });
            },
            set(newValue) {
                this.currentValue = this.getKey(newValue, this.valueProperty);
            }
        },

        /**
         * Returns the visibleResults with the actual selection as first entry
         * @returns {Array}
         */
        visibleResults() {
            if (this.singleSelection) {
                const results = [];
                results.push(this.singleSelection);
                this.results.forEach(option => {
                    // Prevent duplicate options
                    if (this.getKey(option, this.valueProperty) !== this.getKey(this.singleSelection, this.valueProperty)) {
                        results.push(option);
                    }
                });
                return results;
            }

            return this.results;
        },

        actualPathPrefix() {
            const pathParts = this.actualPathParts;

            if (pathParts.length < 1) {
                return '';
            }

            return pathParts.join('.');
        },

        actualPathParts() {
            let pathParts = this.currentValue.split('.');
            if (this.isExpanded) {
                pathParts = this.searchTerm.split('.');
            }

            // remove last element of path which is the user search input
            pathParts.splice(-1, 1);

            // Todo special case for ignoring translations

            return pathParts;
        },

        currentEntity() {
            if (this.actualPathParts.length < 1) {
                return this.entityType;
            }

            const pathParts = this.actualPathParts;

            // Use this.entityType if there is not path yet
            if (pathParts.length === 0) {
                return this.entityType;
            }

            let actualDefinition = Shopware.EntityDefinition.get(this.entityType);
            pathParts.forEach((propertyName) => {
                try {
                    actualDefinition = Shopware.EntityDefinition.get(actualDefinition.properties[propertyName].entity);
                } catch (e) {
                    // ToDO: implement EntityDefinition has function
                }
            });

            return actualDefinition.entity;
        },

        options() {
            const options = [];

            const definition = Shopware.EntityDefinition.get(this.currentEntity);
            const properties = Object.keys(definition.properties);
            let path = this.actualPathPrefix;
            if (path.length > 0) {
                path = path.replace(/\.?$/, '.');
            }
            properties.forEach((propertyName) => {
                const name = `${path}${propertyName}`;
                const property = definition.properties[propertyName];

                if (property.relation) {
                    // Abort conditions
                    if (property.entity === this.entityType) {
                        return;
                    }

                    if (property.relation === 'one_to_many' && propertyName !== 'translations') {
                        return;
                    }
                }
                options.push({ label: name, value: name, relation: property.relation });
            });

            return options;
        },

        results() {
            return this.searchFunction(
                {
                    options: this.options,
                    labelProperty: this.labelProperty,
                    valueProperty: this.valueProperty,
                    searchTerm: this.actualSearch
                }
            );
        }
    },

    methods: {
        isSelected(item) {
            return this.getKey(item, this.valueProperty) === this.value;
        },

        onSelectExpanded() {
            this.isExpanded = true;

            // Get the search text of the selected item as prefilled value
            // this.searchTerm = this.tryGetSearchText(this.singleSelection);
            this.searchTerm = this.currentValue;

            this.$nextTick(() => {
                this.resetActiveItem();
                this.$refs.swSelectInput.select();
                this.$refs.swSelectInput.focus();
            });
        },

        tryGetSearchText(option) {
            return this.getKey(option, this.labelProperty, '');
        },

        onSelectCollapsed() {
            // Empty the selection if the search term is empty
            if (this.searchTerm === '' && !this.itemRecentlySelected) {
                this.$emit('before-selection-clear', this.singleSelection, this.value);
                this.currentValue = null;
            }

            this.$refs.swSelectInput.blur();
            this.searchTerm = '';
            this.actualSearch = '';
            this.itemRecentlySelected = false;
            this.isExpanded = false;
        },

        closeResultList() {
            this.$refs.selectBase.collapse();
        },

        setValue(item) {
            this.itemRecentlySelected = true;
            this.singleSelection = item;

            // If selected item is a relation
            if (item.relation && item.relation !== 'many_to_many') {
                this.searchTerm = `${item.value}.`;
                this.$refs.swSelectInput.select();
                return;
            }

            this.currentValue = item.value;

            this.closeResultList();
        },

        resetActiveItem(pos = 0) {
            // Return if the result list is closed before the search request returns
            if (!this.$refs.resultsList) {
                return;
            }
            // If an item is selected the second entry is the first search result
            if (this.singleSelection) {
                pos = 1;
            }
            this.$refs.resultsList.setActiveItemIndex(pos);
        },

        onInputSearchTerm() {
            this.debouncedSearch();
        },

        debouncedSearch: debounce(function updateSearchTerm() {
            this.search();
        }, 100),

        search() {
            this.$emit('search', this.searchTerm);

            this.actualSearch = this.searchTerm;

            this.$nextTick(() => {
                this.resetActiveItem();
            });
        },

        getKey(object, keyPath, defaultValue) {
            return get(object, keyPath, defaultValue);
        },

        getTranslationProperties(entity, path) {
            const definition = Shopware.EntityDefinition.get(entity);
            const properties = Object.keys(definition.properties);
            const languages = [{ locale: 'DEFAULT' }, { locale: 'de-DE' }, { locale: 'en-GB' }];
            const options = [];

            languages.forEach((language) => {
                properties.forEach(propertyName => {
                    const name = `${path}translations.${language.locale}.${propertyName}`;
                    options.push({ label: name, value: name });
                });
            });

            return options;
        }
    }
});