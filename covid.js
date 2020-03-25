function compute(
  startDate,
  population,
  infectedOnStartDate,
  immunizedOnStartDate,
  r0,
  contagiousnessDuration,
  socialDistancing,
) {
  initialData = {
    infected: infectedOnStartDate,
    infectedToday: infectedOnStartDate,
    immunized: immunizedOnStartDate,
    immunizedToday: 0,
    healthy: population - infectedOnStartDate - immunizedOnStartDate,
  };
  startDate = moment(startDate);

  var data = {};
  data[startDate] = initialData;

  var breaker = 0;
  var dataForDay;
  var currenDay = startDate.clone().add(1, 'days');
  do {
    dataForDay = getInfectedForDay(
      currenDay,
      startDate,
      contagiousnessDuration,
      population,
      r0,
      socialDistancing,
      data,
    );
    data[currenDay] = dataForDay;
    // console.log(dataForDay);
    currenDay = currenDay.clone().add(1, 'days');
    breaker++;
  } while (
    dataForDay.infectedToday > 0 &&
    dataForDay.healthy > 0 &&
    breaker < 200
  );

  populateTable(data, startDate);
  updateChart(data);
}

function getInfectedForDay(
  date,
  startDate,
  contagiousnessDuration,
  population,
  r0,
  socialDistancing,
  data,
) {
  var previousDayData = getDataForRelativeDate(date, -1, data);
  var dataForStartOfInfection = getDataForRelativeDate(
    date,
    -contagiousnessDuration,
    data,
  );

  var healedToday = 0;
  if (dataForStartOfInfection) {
    healedToday = dataForStartOfInfection.infectedToday;
  }

  var chanceToMeetUninfected = previousDayData.healthy / population;
  // console.log('-', chanceToMeetUninfected);
  var infectedToday = Math.ceil(
    previousDayData.infected *
      (r0 / contagiousnessDuration) *
      chanceToMeetUninfected *
      (1 - socialDistancing),
  );
  var totalInfected = previousDayData.infected + infectedToday - healedToday;
  var totalImmunized = previousDayData.immunized + healedToday;

  var row = {
    infected: totalInfected,
    infectedToday: infectedToday,
    immunizedToday: healedToday,
    immunized: previousDayData.immunized + healedToday,
    healthy: population - totalInfected - totalImmunized,
  };

  return row;
}

function getDataForRelativeDate(date, dayCount, data) {
  date = date.clone().add(dayCount, 'days');
  if (typeof data[date] != 'undefined') {
    return data[date];
  }

  return null;
}

function getFirstDay(date, startDate, contagiousnessDuration) {
  // Need to look back at the past `contagiousnessDuration` and sum the people that are contagious over this period
  // to find out how many people are totally infected during this window
  var firstDay = date.clone().subtract(contagiousnessDuration, 'days');

  if (firstDay < startDate) {
    return startDate;
  }

  return firstDay;
}

function populateTable(data, startDate) {
  var table = document.getElementById('tbl');
  table.innerHTML =
    '<tr>\
  <th>Date</th>\
  <th>Healthy</th>\
  <th>Infected Today</th>\
  <th>Total Infected</th>\
  <th>Healed today</th>\
  <th>Total Healed</th>\
</tr>';

  for (var key in data) {
    row = data[key];
    var content =
      '<td>' +
      key +
      '</td><td>' +
      row.healthy +
      '</td><td>' +
      row.infectedToday +
      '</td><td>' +
      row.infected +
      '</td><td>' +
      row.immunizedToday +
      '</td><td>' +
      row.immunized +
      '</td>';
    newRow = table.insertRow();
    newRow.innerHTML = content;
  }

  tableExport.reset();
}

function updateChart(data) {
  var graphData = {
    infected: [],
    infectedToday: [],
    immunized: [],
    immunizedToday: [],
    healthy: [],
    label: [],
  };

  position = 0;
  for (var key in data) {
    // Loop through each date
    if (data.hasOwnProperty(key)) {
      row = data[key];
      for (var attribute in row) {
        graphData[attribute].push(row[attribute]);
      }
    }
    graphData['label'].push(++position);
  }
  myChart.data.labels = graphData['label'];
  // myChart.data.datasets[0].data = graphData['infected'];
  myChart.data.datasets = [];
  myChart.data.datasets.push(
    chartDataset('Infected', graphData['infected'], 'rgba(255, 99, 132, 0.5)'),
  );
  myChart.data.datasets.push(
    chartDataset(
      'Susceptible',
      graphData['healthy'],
      'rgba(130, 99, 232, 0.5)',
    ),
  );
  myChart.data.datasets.push(
    chartDataset(
      'Immunized',
      graphData['immunized'],
      'rgba(130, 200, 132, 0.5)',
    ),
  );
  myChart.update();
}

function chartDataset(name, data, color) {
  return {
    label: name,
    data: data,
    backgroundColor: Array(data.length).fill(color),
    barPercentage: 1.0,
    categoryPercentage: 1.0,
  };
}

document.addEventListener(
  'DOMContentLoaded',
  function() {
    update();
  },
  false,
);

function update() {
  compute(
    '2020-03-20',
    Number(document.getElementById('population').value),
    Number(document.getElementById('infections').value),
    0,
    Number(document.getElementById('r0').value),
    Number(document.getElementById('duration').value),
    Number(document.getElementById('socialdistancing').value),
  );
}
