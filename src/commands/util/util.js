export const getDefaultOption = component => component.options.find(_ => _.default)

export const setDefaultOption = (component, defaultValue) =>
    component.options.forEach(_ => {
        _.default = _.value == defaultValue
    })