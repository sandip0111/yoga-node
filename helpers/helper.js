function getTimeBefore(duration) {
    // Split start and end times
    let [start, end] = duration.split(" - ");

    // Convert start time to Date object
    let startTime = parseTime(start);

    // Subtract 10 minutes
    let timeBefore = new Date(startTime);
    timeBefore.setMinutes(timeBefore.getMinutes() - 10);

    // Format output
    return {
        startTime: formatTime(startTime),
        timeBefore: formatTime(timeBefore)
    };
}

// Function to parse time string to Date object
function parseTime(timeStr) {
    let isPM = timeStr.includes("PM");
    let [hours, minutes] = timeStr.replace("AM", "").replace("PM", "").split(":");
    
    hours = parseInt(hours);
    minutes = minutes ? parseInt(minutes) : 0;

    // Convert 12-hour format to 24-hour format
    if (isPM && hours !== 12) hours += 12;
    if (!isPM && hours === 12) hours = 0; // Handle midnight (12 AM)

    let date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    return date;
}

// Function to format Date object to "h AM/PM"
function formatTime(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let suffix = hours >= 12 ? "PM" : "AM";

    hours = hours % 12 || 12; // Convert 24-hour to 12-hour format

    return `${hours}${minutes ? ":" + String(minutes).padStart(2, "0") : ""} ${suffix}`;
}

module.exports = { getTimeBefore };
