var previousValue = [];
var previousLength = 0;
google.charts.load("current", {
    packages: ['corechart']
});
google.charts.setOnLoadCallback(refreshItems);
$(document).ready(function () {


    // Fetch the initial table
    refreshItems();

    // Fetch every 1 second
    setInterval(refreshItems, 1000);
});

function refreshItems() {
    var url = "https://spreadsheets.google.com/feeds/list/1G2TqeqQPRCPhgr5MUfgbS0_Oty2FJ4OYhdCkeI0fh9M/5/public/full?alt=json"
    var graph_arr = [
        ['Order ID', 'Time Taken', {
            role: 'style'
        }]
    ];
    var bar_color = [];
    var jsonDataObject = [];
    var jsonMapObject = [];
    var container = L.DomUtil.get('map');
    if (container != null) {
        container._leaflet_id = null;
    }
    var map = L.map('map').setView([20.5937, 78.9629], 4);


    $.getJSON(url, function (data) {
        var currentValue = [];
        var flag = false;
        for (var i = 0; i < data.feed.entry.length; i++) {
            var obj = {
                "Dispatched": data.feed.entry[i].gsx$dispatched.$t,
                "Shipped": data.feed.entry[i].gsx$shipped.$t
            }

            currentValue.push(obj);
        }
        for (var i = 0; i < data.feed.entry.length; i++) {

            if (previousLength != data.feed.entry.length) {
                break;
            }
            if (previousValue[i].Dispatched != data.feed.entry[i].gsx$dispatched.$t || previousValue[i].Shipped != data.feed.entry[i].gsx$shipped.$t) {
                flag = true;
                break;
            }
        }


        var trHTML = '';
        if (previousLength != data.feed.entry.length || flag == true) {

            previousLength = data.feed.entry.length;
            previousValue = currentValue;
            console.log(previousValue)

            //table
            for (var i = 0; i < data.feed.entry.length; ++i) {
                var myData_map, myData_order;

                trHTML += '<tr><td>' + data.feed.entry[i].gsx$orderid.$t +
                    '</td><td>' + data.feed.entry[i].gsx$item.$t +
                    '</td><td>' + data.feed.entry[i].gsx$priority.$t +
                    '</td><td>' + data.feed.entry[i].gsx$quantity.$t +
                    '</td><td>' + data.feed.entry[i].gsx$city.$t +
                    '</td><td>' + data.feed.entry[i].gsx$dispatched.$t +
                    '</td><td>' + data.feed.entry[i].gsx$shipped.$t +
                    '</td><td>' + data.feed.entry[i].gsx$orderdateandtime.$t +
                    '</td><td>' + data.feed.entry[i].gsx$dispatchdateandtime.$t +
                    '</td><td>' + data.feed.entry[i].gsx$shippingdateandtime.$t +
                    '</td><td>' + data.feed.entry[i].gsx$timetakeninseconds.$t +
                    '</td></tr>';


                var json_data = {
                    "OderID": data.feed.entry[i].gsx$orderid.$t,
                    "TimeTaken": parseFloat(data.feed.entry[i].gsx$timetakeninseconds.$t),
                    "Priority": data.feed.entry[i].gsx$priority.$t
                };
                jsonDataObject.push(json_data);
                if (json_data.Priority == "HP") {
                    var color = '#FF0000';
                } else if (json_data.Priority == 'MP') {
                    var color = '#FFFF00';
                } else if (json_data.Priority == 'LP') {
                    var color = '#00FF00';
                }
                bar_color.push(color)



                var json_data2 = {
                    "City": data.feed.entry[i].gsx$city.$t,
                    "OderID": data.feed.entry[i].gsx$orderid.$t,
                    "Item": data.feed.entry[i].gsx$item.$t,
                    "Latitude": parseFloat(data.feed.entry[i].gsx$latitude.$t),
                    "Longitude": parseFloat(data.feed.entry[i].gsx$longitude.$t),
                    "Dispatched": data.feed.entry[i].gsx$dispatched.$t,
                    "Shipped": data.feed.entry[i].gsx$shipped.$t
                };
                jsonMapObject.push(json_data2);

            }
            $('#tableContent').html(trHTML);
            $('#table_id').DataTable();
            // Converting Json Object to JavaScript Array
            for (var j in jsonDataObject) {
                graph_arr.push([jsonDataObject[j].OderID, jsonDataObject[j].TimeTaken, bar_color[j]]);
            }
            var graphArray_Final = google.visualization.arrayToDataTable(graph_arr);
            var data = new google.visualization.DataView(graphArray_Final);
            var options = {
                // title: 'Time Taken for items to be Shipped',
                hAxis: {
                    title: 'Order ID'
                },
                vAxis: {
                    title: 'Time Taken (s)'
                },
                legend: {
                    position: "none"
                },
            };
            var chart = new google.visualization.ColumnChart(document.getElementById('column_chart'));
            chart.draw(data, options);


            for (var j = 0; j < jsonMapObject.length; j++) {

                var colorIcon;


                var LeafIcon = L.Icon.extend({
                    options: {

                        iconAnchor: [20, 30]
                        // popupAnchor: [-3, -76]
                    }
                });

                var greenIcon = new LeafIcon({
                    iconUrl: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
                }),
                    redIcon = new LeafIcon({
                        iconUrl: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
                    }),
                    yellowIcon = new LeafIcon({
                        iconUrl: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
                    });



                if (jsonMapObject[j].Dispatched == "YES" && jsonMapObject[j].Shipped == "YES") {
                    colorIcon = greenIcon;
                } else if (jsonMapObject[j].Dispatched == "YES" && jsonMapObject[j].Shipped != "YES") {
                    colorIcon = yellowIcon;
                } else if (jsonMapObject[j].Dispatched != "YES" && jsonMapObject[j].Dispatched != "YES") {
                    colorIcon = redIcon;
                }
                var marker = L.marker(L.latLng(parseFloat(jsonMapObject[j].Latitude), parseFloat(jsonMapObject[j].Longitude)), {
                    icon: colorIcon
                }).addTo(map);

                marker.on('click', onClick_Marker)
                // Attach the corresponding JSON data to your marker:
                marker.myJsonData = jsonMapObject[j];

                function onClick_Marker(e) {
                    var marker = e.target;
                    popup = L.popup()
                        .setLatLng(marker.getLatLng())
                        .setContent("Order ID: " + marker.myJsonData.OderID + " || Item: " +
                            marker.myJsonData.Item)
                        .openOn(map);
                }

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(map);


            }



        }


    });
}
