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

  let data = {};
  data[startDate] = initialData;

  let breaker = 0;
  let dataForDay;
  let currenDay = startDate.clone().add(1, 'days');
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
  const previousDayData = getDataForRelativeDate(date, -1, data);
  const dataForStartOfInfection = getDataForRelativeDate(
    date,
    -contagiousnessDuration,
    data,
  );

  let healedToday = 0;
  if (dataForStartOfInfection) {
    healedToday = dataForStartOfInfection.infectedToday;
  }

  let chanceToMeetUninfected = previousDayData.healthy / population;
  // console.log('-', chanceToMeetUninfected);
  let infectedToday = Math.ceil(
    previousDayData.infected *
      (r0 / contagiousnessDuration) *
      chanceToMeetUninfected *
      (1 - socialDistancing),
  );
  let totalInfected = previousDayData.infected + infectedToday - healedToday;
  let totalImmunized = previousDayData.immunized + healedToday;

  let row = {
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
  const firstDay = date.clone().subtract(contagiousnessDuration, 'days');

  if (firstDay < startDate) {
    return startDate;
  }

  return firstDay;
}

function populateTable(data, startDate) {
  let table = document.getElementById('tbl');

  for (var key in data) {
    row = data[key];
    let content =
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
}

function updateChart(data) {
  let graphData = {
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
      for (let attribute in row) {
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
    borderColor: [
      'rgba(255, 99, 132, 1)',
      'rgba(54, 162, 235, 1)',
      'rgba(255, 206, 86, 1)',
      'rgba(75, 192, 192, 1)',
      'rgba(153, 102, 255, 1)',
      'rgba(255, 159, 64, 1)',
    ],
    borderWidth: 1,
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
