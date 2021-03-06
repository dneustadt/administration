import template from './sw-entity-multi-id-select.html.twig';

const { Component, Context, Mixin } = Shopware;
const { EntityCollection, Criteria } = Shopware.Data;

Component.register('sw-entity-multi-id-select', {
    template,
    inheritAttrs: false,

    model: {
        prop: 'ids',
        event: 'change'
    },

    mixins: [
        Mixin.getByName('remove-api-error')
    ],

    props: {
        ids: {
            type: Array,
            required: false,
            default() {
                return [];
            }
        },

        repository: {
            type: Object,
            required: true
        },

        criteria: {
            type: Object,
            required: false,
            default() {
                return new Criteria();
            }
        },

        context: {
            type: Object,
            required: false,
            default() {
                return Context.api;
            }
        },

        disabled: {
            type: Boolean,
            required: false,
            default: false
        }
    },

    data() {
        return {
            collection: null
        };
    },

    created() {
        this.createdComponent();
    },

    methods: {
        createdComponent() {
            this.collection = new EntityCollection(
                this.repository.route,
                this.repository.entityName,
                this.context
            );

            if (this.ids.length <= 0) {
                return Promise.resolve(this.collection);
            }

            const criteria = Criteria.fromCriteria(this.criteria);
            criteria.setIds(this.ids);

            return this.repository.search(criteria, this.context).then((entities) => {
                this.collection = entities;
                return this.collection;
            });
        },

        updateIds(collection) {
            this.collection = collection;
            this.$emit('change', collection.getIds());
        }
    }
});
