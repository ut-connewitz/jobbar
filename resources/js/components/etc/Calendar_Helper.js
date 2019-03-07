import React from "react";
import moment from 'moment';

export const getJobsAtDate = (jobs, date, unit = 'day') => {
    const jobsAt = jobs.filter(job => {
        if (job.start_date == null) {
            return false;
        }
        const jobDate = moment(job.start_date);
        return jobDate.isSame(date, unit);
    })
    return jobsAt;
}

export const getJobsInDates = (jobs, dateFrom, dateTo, unit = null) => {
    const jobsIn = jobs.filter(job => {
        if (job.start_date == null) {
            return false;
        }
        const jobDate = moment(job.start_date);
        return jobDate.isBetween(dateFrom, dateTo, unit);
    })
    return jobsIn;
}

export const getDays = (startDate) => {
    const days = [];
    const currentDate = moment(startDate);
    const endDate = startDate.daysInMonth();
    let currentCounter = startDate.format('D');

    while (currentCounter <= endDate) {
        days.push(currentDate.clone());
        currentDate.add(1, "days");
        currentCounter++;
    }
    return days;
}

export const MonthListDay = ({date, children}) => {
    return (
        <div className={`row day-wrapper ${date.isSame(moment(), 'day') ? 'day-today' : ''}`}>
            <div className={`one wide column day-data ${date.day() == 0 ? 'day-sunday' : ''}`}>
                <div className="day-date">{date.format("Do")}</div>
                <div className="day-weekday">{date.format("ddd")}</div>
            </div>
            {children}
        </div>
    )
}