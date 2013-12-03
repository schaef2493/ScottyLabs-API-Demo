// Provided by Scottylabs
var appID = '';

// Provided by Scottylabs
var appKey = '';

// Base API URL
var baseURL = 'https://apis.scottylabs.org/v1/schedule/S14/'

// Set of predefined calendar colors
var colors = ['#1abc9c', '#3498db', '#9b59b6', '#34495e', '#f39c12', '#d35400', '#e74c3c', '#c0392b'];

$(document).ready(function() {

	// Allow user to input course numbers
	$('#newCourseInput').keyup(function(e) {
		// If user presses enter
	    if (e.keyCode == 13) {
	        addCourse($('#newCourseInput').val());
	        $('#newCourseInput').val('');
	    }
	});

});

// Either a lecture or recitation
function subCourse() {
	this.days = null;
	this.instructors = null;
	this.location = null;
	this.section = null;
	this.time_start = null;
	this.time_end = null;
}

// Collection of lecture and optional recitation
function course() {
	this.name = null;
	this.number = null;
	this.units = null;
	this.lecture = null;
	this.recitation = null;
	this.color = null;
}

// Display hour columns on calendar
function addHours(){
	for(var i= 0; i<5; i++){
		function addtoday(day){
			function addhour(day, hourtime){
				var hour = document.createElement('div');
				hour.setAttribute('class','hour');
				hour.setAttribute('id',day+'+'+hourtime);
				return hour;
			}
			today = document.createElement('div');
			for(var j=7; j<22; j++){
				today.appendChild(addhour(day, j));
			}
			return today;
		}
		document.getElementById(i+'').innerHTML=addtoday(i).innerHTML;
	}
}

// Add an event to the calendar
function addEvent(day, hour, length, desc, color){
	var event = document.createElement('div');
	event.setAttribute('class', 'event')
	event.setAttribute('style','position:absolute; top:' + Math.floor(hour*51-356) + 'px; height:'+ Math.floor(length*35/60) + 'px;' + 'background-color:' + color);
	event.innerHTML="<span class=title>" + desc + "</span>";
	document.getElementById(day).appendChild(event);
}

// Convert SL API time string to a decimal
function convertTimeToDecimal(time) {
	var hour = Number(time.substr(0,2));
	var minute = Number(time.substr(2,4));
	var decimal = minute/60;
	return hour+decimal;
}

// Converts a 12 hour time string to a 24 hour time string
function convertTo24Hour(time) {
	if ((time.length == 7) && (time[0] == "0")) {
		time = time.substring(1, time.length);
	}

    var hours = parseInt(time.substr(0, 2));

    if(time.indexOf('AM') != -1 && hours == 12) {
        time = time.replace('12', '0');
    }

    if(time.indexOf('PM') != -1 && hours < 12) {
        time = time.replace(hours, (hours + 12));
    }

    var time = time.replace(/(am|pm|AM|PM)/, '').replace(':', '');

    if (time.length == 3) {
    	return "0" + time;
    } else {
    	return time;
    }
}

// Splits a combined course into course objects (lectures, recitations, etc)
function splitCourseObject(courseObj) {
	var splitCourse = [];

	for (var i=0; i<courseObj.lectures.length; i++) {
		if (courseObj.lectures[i].recitations != undefined) {

			for (var n=0; n<courseObj.lectures[i].recitations.length; n++) {
				// Hide non-Pittsburgh courses
				if ((courseObj.lectures[i].recitations[n].section != "W") && 
					(courseObj.lectures[i].recitations[n].section != "X") &&
					(courseObj.lectures[i].recitations[n].section != "Y") &&
					(courseObj.lectures[i].recitations[n].section != "Z")) {

					var newCourse = new course();
					newCourse.name = courseObj.name;
					newCourse.number = courseObj.number;
					newCourse.units = courseObj.units;

					var lecture = new subCourse();
					lecture.days = courseObj.lectures[i].days;
					lecture.instructors = courseObj.lectures[i].instructors;
					lecture.location = courseObj.lectures[i].location;
					lecture.section = courseObj.lectures[i].section;
					lecture.time_start = convertTo24Hour(courseObj.lectures[i].time_start);
					lecture.time_end = convertTo24Hour(courseObj.lectures[i].time_end);

					var recitation = new subCourse();
					recitation.days = courseObj.lectures[i].recitations[n].days;
					recitation.instructors = courseObj.lectures[i].recitations[n].instructors;
					recitation.location = courseObj.lectures[i].recitations[n].location;
					recitation.section = courseObj.lectures[i].recitations[n].section;
					recitation.time_start = convertTo24Hour(courseObj.lectures[i].recitations[n].time_start);
					recitation.time_end = convertTo24Hour(courseObj.lectures[i].recitations[n].time_end);

					newCourse.lecture = lecture;
					newCourse.recitation = recitation;

					// Assign a random color
					newCourse.color = colors[Math.floor(Math.random()*colors.length)];

					splitCourse.push(newCourse);
				}
			}

		} else {
			if ((courseObj.lectures[i].section != "W") && 
				(courseObj.lectures[i].section != "X") &&
				(courseObj.lectures[i].section != "Y") &&
				(courseObj.lectures[i].section != "Z")) {

				var newCourse = new course();
				newCourse.name = courseObj.name;
				newCourse.number = courseObj.number;
				newCourse.units = courseObj.units;

				var lecture = new subCourse();
				lecture.days = courseObj.lectures[i].days;
				lecture.instructors = courseObj.lectures[i].instructors;
				lecture.location = courseObj.lectures[i].location;
				lecture.section = courseObj.lectures[i].section;
				lecture.time_start = convertTo24Hour(courseObj.lectures[i].time_start);
				lecture.time_end = convertTo24Hour(courseObj.lectures[i].time_end);

				newCourse.lecture = lecture;

				// Assign a random color
				newCourse.color = colors[Math.floor(Math.random()*colors.length)];

				splitCourse.push(newCourse);
			}
		}	
	}

	return splitCourse;
}

// Adds a course to the calendar
function addCourse(courseNumber) {
	$.getJSON(baseURL + 'courses/' + courseNumber + '?app_id=' + appID + '&app_secret_key=' + appKey, function(course) {
		var courseObjects = splitCourseObject(course.course);

		// Loop through course objects
		for (var i=0; i<courseObjects.length; i++) {
			var course = courseObjects[i];

			// Display lecture
			if (course.lecture != undefined) {

				// Does lecture occur on Monday?
				if (course.lecture.days.indexOf('M') != -1) {
					addEvent(0, convertTimeToDecimal(course.lecture.time_start), 
						Number(course.lecture.time_end)-Number(course.lecture.time_start), 
						course.number + " Lecture", course.color);
				}

				// Does lecture occur on Tuesday?
				if (course.lecture.days.indexOf('T') != -1) {
					addEvent(1, convertTimeToDecimal(course.lecture.time_start), 
						Number(course.lecture.time_end)-Number(course.lecture.time_start), 
						course.number + " Lecture", course.color);
				}

				// Does lecture occur on Wednesday?
				if (course.lecture.days.indexOf('W') != -1) {
					addEvent(2, convertTimeToDecimal(course.lecture.time_start), 
						Number(course.lecture.time_end)-Number(course.lecture.time_start), 
						course.number + " Lecture", course.color);
				}

				// Does lecture occur on Thursday?
				if (course.lecture.days.indexOf('R') != -1) {
					addEvent(3, convertTimeToDecimal(course.lecture.time_start), 
						Number(course.lecture.time_end)-Number(course.lecture.time_start), 
						course.number + " Lecture", course.color);
				}

				// Does lecture occur on Friday?
				if (course.lecture.days.indexOf('F') != -1) {
					addEvent(4, convertTimeToDecimal(course.lecture.time_start), 
						Number(course.lecture.time_end)-Number(course.lecture.time_start), 
						course.number + " Lecture", course.color);
				}
			}

			// Display recitation
			if (course.recitation != undefined) {

				// Does recitation occur on Monday?
				if (course.recitation.days.indexOf('M') != -1) {
					addEvent(0, convertTimeToDecimal(course.recitation.time_start), 
						Number(course.recitation.time_end)-Number(course.recitation.time_start), 
						course.number + " Recitation", course.color);
				}

				// Does recitation occur on Tuesday?
				if (course.recitation.days.indexOf('T') != -1) {
					addEvent(1, convertTimeToDecimal(course.recitation.time_start), 
						Number(course.recitation.time_end)-Number(course.recitation.time_start), 
						course.number + " Recitation", course.color);
				}

				// Does recitation occur on Wednesday?
				if (course.recitation.days.indexOf('W') != -1) {
					addEvent(2, convertTimeToDecimal(course.recitation.time_start), 
						Number(course.recitation.time_end)-Number(course.recitation.time_start), 
						course.number + " Recitation", course.color);
				}

				// Does recitation occur on Thursday?
				if (course.recitation.days.indexOf('R') != -1) {
					addEvent(3, convertTimeToDecimal(course.recitation.time_start), 
						Number(course.recitation.time_end)-Number(course.recitation.time_start), 
						course.number + " Recitation", course.color);
				}

				// Does recitation occur on Friday?
				if (course.recitation.days.indexOf('F') != -1) {
					addEvent(4, convertTimeToDecimal(course.recitation.time_start), 
						Number(course.recitation.time_end)-Number(course.recitation.time_start), 
						course.number + " Recitation", course.color);
				}
			}
		}
	});
}