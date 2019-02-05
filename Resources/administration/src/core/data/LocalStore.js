import { hasOwnProperty } from 'src/core/service/utils/object.utils';

/**
 * @module core/data/LocalStore
 */

/**
 * @class
 * @memberOf module:core/data/LocalStore
 */
export default class LocalStore {
    /**
     * @constructor
     * @memberOf module:core/data/LocalStore
     * @param {object} values
     * @param {string} propertyName
     */
    constructor(values, propertyName = 'id') {
        this.store = {};
        Object.keys(values).forEach((key) => {
            this.store[key] = values[key];
            if (this.store[key].meta) {
                return;
            }

            this.store[key].meta = { viewData: values[key] };
        });
        this.propertyName = propertyName;
    }

    /**
     *
     * @param {String} id
     * @returns {*}
     */
    getById(id) {
        if (!this.hasId(id)) {
            return {};
        }

        return this.store[id];
    }

    getByIdAsync(id) {
        return this.getById(id);
    }

    getList(params) {
        return new Promise((resolve) => {
            let store = Object.values(this.store);
            if (params.term) {
                const searchTerm = params.term.toLowerCase();
                store = store.filter((value) => value[this.propertyName].toLowerCase().includes(searchTerm)
                    || value.meta.viewData[this.propertyName].toLowerCase().includes(searchTerm));
            }

            if (params.criteria) {
                const query = params.criteria.getQuery();
                if (query.type === 'contains') {
                    store = store.filter(value => value[query.field].match(query.value));
                } else if (query.type === 'equals') {
                    store = store.filter(value => value[query.field] === query.value);
                }
            }

            if (params.sortBy) {
                const sortDirection = params.sortDirection === 'ASC' ? 1 : -1;

                store = store.sort((valueA, valueB) => {
                    return valueA[this.propertyName].localeCompare(valueB[this.propertyName]) * sortDirection;
                });
            }

            if (params.limit && params.limit < Object.keys(this.store).length) {
                const page = params.page !== undefined ? params.page - 1 : 0;

                store = store.slice(params.limit * page, params.limit);
            }
            resolve({ items: store, total: Object.keys(this.store).length, aggregations: [] });
        });
    }

    hasId(id) {
        return this.store[id] !== undefined;
    }

    static create() {
        return {};
    }

    static duplicate() {
        return {};
    }

    add(entity) {
        if (!hasOwnProperty(entity, this.propertyName)) {
            return false;
        }

        this.store[entity[this.propertyName]] = entity;
        this.store[entity[this.propertyName]].meta = { viewData: entity };
        return true;
    }

    remove(entity) {
        if (!hasOwnProperty(entity, this.propertyName) || this.hasId(this.propertyName)) {
            return false;
        }

        delete this.store[entity[this.propertyName]];
        return true;
    }
}
