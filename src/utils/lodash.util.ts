
import _ from 'lodash';

export const pickFields = <T extends object>(object: T, paths: string[]): Partial<T> => {
    return _.pick(object, paths);
};

export const omitFields = <T extends object>(object: T, paths: string[]): Partial<T> => {
    return _.omit(object, paths);
};

export const getMissingFields = (object: any, fields: string[]): string[] => {
    return _.filter(fields, (field) => !_.has(object, field) || _.isNil(_.get(object, field)));
};

export const formatResponse = (data: any, message: string = 'Success', meta: object = {}) => {
    return {
        success: true,
        message,
        data: _.isEmpty(data) && !_.isNumber(data) && !_.isBoolean(data) ? null : data,
        meta: _.isEmpty(meta) ? undefined : meta,
        timestamp: new Date().toISOString()
    };
};

export const formatError = (error: any, statusCode: number = 500) => {
    const message = _.isString(error)
        ? error
        : _.get(error, 'message', 'Internal Server Error');

    const details = _.get(error, 'details', null);

    return {
        success: false,
        statusCode,
        error: message,
        details: !_.isEmpty(details) ? details : undefined,
        timestamp: new Date().toISOString()
    };
};

export const cleanObject = (obj: any): any => {
    return _.transform(obj, (result: any, value: any, key: any) => {
        const isObject = _.isObject(value);
        if (value === null || value === undefined) return;

        result[key] = isObject ? cleanObject(value) : value;
    });
};


export const isEmptyValue = (value: any): boolean => {
    if (_.isNumber(value) || _.isBoolean(value)) return false;
    return _.isEmpty(value);
};
