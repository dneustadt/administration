import template from './sw-settings-delivery-time-detail.html.twig';

const { Component, Mixin } = Shopware;
const ShopwareError = Shopware.Classes.ShopwareError;
const { mapPropertyErrors } = Component.getComponentHelper();

Component.register('sw-settings-delivery-time-detail', {
    template,

    mixins: [
        Mixin.getByName('notification')
    ],

    inject: ['repositoryFactory', 'acl'],

    shortcuts: {
        'SYSTEMKEY+S': {
            active() {
                return this.allowSave;
            },
            method: 'onSave'
        },

        ESCAPE: 'onCancel'
    },

    data() {
        return {
            deliveryTime: null,
            isLoading: false,
            isSaveSuccessful: false
        };
    },

    metaInfo() {
        return {
            title: this.$createTitle()
        };
    },

    created() {
        this.createdComponent();
    },

    methods: {
        createdComponent() {
            this.isLoading = true;

            this.deliveryTimeRepository
                .get(this.$route.params.id, Shopware.Context.api)
                .then((deliveryTime) => {
                    this.deliveryTime = deliveryTime;
                    this.isLoading = false;
                })
                .catch((exception) => {
                    this.createNotificationError({
                        message: this.$tc('sw-settings-delivery-time.detail.errorLoad')
                    });

                    this.isLoading = false;
                    throw exception;
                });
        },

        onSave() {
            this.isLoading = true;
            this.isSaveSuccessful = false;

            return this.deliveryTimeRepository
                .save(this.deliveryTime, Shopware.Context.api)
                .then(() => {
                    this.isLoading = false;
                    this.isSaveSuccessful = true;
                })
                .catch((exception) => {
                    this.createNotificationError({
                        message: this.$tc('sw-settings-delivery-time.detail.errorSave')
                    });

                    this.isLoading = false;
                    throw exception;
                });
        },

        onChangeLanguage() {
            this.createdComponent();
        },

        saveFinish() {
            this.isSaveSuccessful = false;
        },

        onCancel() {
            this.$router.push({ name: 'sw.settings.delivery.time.index' });
        }
    },

    computed: {
        ...mapPropertyErrors('deliveryTime', [
            'name',
            'min',
            'max',
            'unit'
        ]),

        deliveryTimeRepository() {
            return this.repositoryFactory.create('delivery_time');
        },

        deliveryTimeUnits() {
            return [{
                value: 'day',
                label: this.$tc('sw-settings-delivery-time.detail.selectionUnitDay')
            }, {
                value: 'week',
                label: this.$tc('sw-settings-delivery-time.detail.selectionUnitWeek')
            }, {
                value: 'month',
                label: this.$tc('sw-settings-delivery-time.detail.selectionUnitMonth')
            }, {
                value: 'year',
                label: this.$tc('sw-settings-delivery-time.detail.selectionUnitYear')
            }];
        },

        displayName() {
            if (this.deliveryTime && this.deliveryTime.name) {
                return this.deliveryTime.name;
            }
            return this.$tc('sw-settings-delivery-time.detail.textHeadlineNew');
        },

        isInvalidMinField() {
            return this.deliveryTime.min > this.deliveryTime.max;
        },

        invalidMinError() {
            if (this.isInvalidMinField) {
                return new ShopwareError({ code: 'DELIVERY_TIME_MIN_INVALID' });
            }
            return null;
        },

        allowSave() {
            if (!this.deliveryTime) {
                return false;
            }

            if (this.deliveryTime.isNew()) {
                return this.acl.can('delivery_times.creator');
            }

            return this.acl.can('delivery_times.editor');
        },

        tooltipSave() {
            if (!this.allowSave) {
                return {
                    message: this.$tc('sw-privileges.tooltip.warning'),
                    disabled: this.allowSave,
                    showOnDisabledElements: true
                };
            }

            const systemKey = this.$device.getSystemKey();

            return {
                message: `${systemKey} + S`,
                appearance: 'light'
            };
        },

        tooltipCancel() {
            return {
                message: 'ESC',
                appearance: 'light'
            };
        }
    }
});
