// Susceptible equation
function dS_dt(S, I, R_t, T_inf) {
  return -(R_t / T_inf) * I * S;
}

// Exposed equation
function dE_dt(S, E, I, R_t, T_inf, T_inc) {
  return (R_t / T_inf) * I * S - Math.pow(T_inc, -1) * E;
}

// Infected equation
function dI_dt(I, E, T_inc, T_inf) {
  return Math.pow(T_inc, -1) * E - Math.pow(T_inf, -1) * I;
}

// Recovered equation
function dR_dt(I, T_inf) {
  return Math.pow(T_inf, -1) * I;
}

function SEIR_model(t, y, R_t, T_inf, T_inc) {
  var S = y.S;
  var E = y.E;
  var I = y.I;
  var R = y.R;
  var reproduction = R_t;

  S_out = dS_dt(S, I, reproduction, T_inf);
  E_out = dE_dt(S, E, I, reproduction, T_inf, T_inc);
  I_out = dI_dt(I, E, T_inc, T_inf);
  R_out = dR_dt(I, T_inf);

  return {
    S: S_out,
    E: E_out,
    I: I_out,
    R: R_out,
  };
}

function compute(
  population,
  infectedOnStartDate,
  r0,
  incubationTime,
  recoveryTime,
  maxDays,
) {
  var N = population;
  var n_infected = infectedOnStartDate;

  var last = {
    S: (N - n_infected) / N,
    E: 0,
    I: n_infected / N,
    R: 0,
  };
  var total = [last];

  for (var i = 0; i < maxDays; i++) {
    var result = SEIR_model(i, last, r0, recoveryTime, incubationTime);
    last = {
      S: last.S + result.S,
      E: last.E + result.E,
      I: last.I + result.I,
      R: last.R + result.R,
    };
    total.push(last);

    // Stop when noone else is exposed
    if (last.E * N < 1) {
      break;
    }
  }

  return total;
}

function annotateData(result, N, infectedOnStartDate, startDate) {
  var last = {
    I: infectedOnStartDate,
    R: 0,
  };

  return result.map(function(x, i) {
    const data = {
      S: Math.round(x.S * N),
      E: Math.round(x.E * N),
      I: Math.round(x.I * N),
      R: Math.round(x.R * N),
      date: moment(startDate)
        .add(i, 'days')
        .format('YYYY-MM-DD'),
    };

    // For backward compatibility
    data.recoveredToday = data.R - last.R;
    data.infectedToday = data.I - last.I + data.recoveredToday;
    data.healthy = N - data.I - data.R;

    last = data;

    return data;
  });
}

function drawChart(chart, data) {
  chart.options.scales.xAxes[0].ticks.max = data.length;
  ['S', 'E', 'I', 'R'].forEach(function(x, i) {
    chart.data.datasets[i].data = data.map(function(y) {
      return y[x];
    });
  });
  chart.update();
}

function populateTable(table, data, state) {
  data.forEach(function(row, i) {
    newRow = table.insertRow();
    newRow.innerHTML =
      '<td>' +
      row.date +
      '</td><td>' +
      (state ? state + '</td><td>' : '') +
      row.healthy +
      '</td><td>' +
      row.S +
      '</td><td>' +
      row.E +
      '</td><td>' +
      row.I +
      '</td><td>' +
      row.infectedToday +
      '</td><td>' +
      row.R +
      '</td><td>' +
      row.recoveredToday +
      '</td>';
  });
}

function exportCsv() {
  var data = tableExport.reset().getExportData();
  var csvData = data.tbl.csv;
  tableExport.export2file(
    csvData.data,
    csvData.mimeType,
    csvData.filename,
    csvData.fileExtension,
    csvData.merges,
    csvData.RTL,
    csvData.sheetname,
  );
}

function update(listParam) {
  var list =
    listParam && listParam.length
      ? listParam
      : [
          {
            state: '',
            population: Number(document.getElementById('population').value),
            cases: Number(document.getElementById('infections').value),
          },
        ];

  var table = document.getElementById('tbl');
  table.innerHTML =
    '<tr>\
      <th>Date</th>' +
    ((list[0] || {}).state ? '<th>State</th>' : '') +
    '<th>Healthy</th>\
    <th>Suspectible</th>\
      <th>Exposed</th>\
      <th>Infected</th>\
      <th>Infected today</th>\
      <th>Recovered</th>\
      <th>Recovered today</th>\
    </tr>';

  list.forEach(function(item) {
    var result = compute(
      item.population,
      item.cases,
      Number(document.getElementById('r0').value),
      Number(document.getElementById('duration').value),
      Number(document.getElementById('recovery').value),
      MAX_DAYS || 200,
    );

    var data = annotateData(
      result,
      item.population,
      item.cases,
      moment('2020-03-20'),
    );

    if (window.myChart) {
      drawChart(window.myChart, data);
    }

    populateTable(table, data, item.state);
  });
}
