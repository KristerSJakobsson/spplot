import * as d3 from "d3";

const parseDateString = d3.timeParse("%Y%m%d"); // Note: We remove the `-` in the parsing function below
const formatDateString = d3.timeFormat("%Y-%m-%d");

export function parseDate(date) {
    let dateString;
    if (date instanceof Date) {
        dateString = `${date.getFullYear()}${date.getMonth()}${date.getDate()}`
    } else {
        dateString = `${date}`.replace(/-/g, "") // This covers both the case of integer (19990909) and string (1999-09-09)
    }

    return parseDateString(dateString);
}

export function formatDate(timeFormat) {
    return formatDateString(timeFormat);
}

export function formatPercent(decimal, precision) {
    return d3.format(`.${precision}%`)(decimal)
}