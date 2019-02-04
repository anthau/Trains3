import React from 'react';

import './App.css';
import { Map, Marker, TileLayer } from "react-leaflet";
import Modal from 'react-responsive-modal';
import styled from "styled-components";
import L from "leaflet";



class Stations extends React.Component {
  data = null
  constructor(props) {
    super(props)

    this.state = {

      stations: [],
      stationName: '',
      open: false,
      data: '',
      longName: [],
      code:'',
      lan:0,
      lot:0


    }
    alert('Tervetuloa ohjelmaan: Tekijä: Antto Hautamäki, kulkutiedot digitraffic')
  }

  onOpenModal() {
    this.setState({ open: true });
  };
  calculate(train)  {
    //lainattu funktio distance https://www.geodatasource.com/developers/javascript
    function distance(lat1, lon1, lat2, lon2, unit) {
      if ((lat1 === lat2) && (lon1 === lon2)) {
        return 0;
      }
      else {
        var radlat1 = Math.PI * lat1/180;
        var radlat2 = Math.PI * lat2/180;
        var theta = lon1-lon2;
        var radtheta = Math.PI * theta/180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        if (dist > 1) {
          dist = 1;
        }
        dist = Math.acos(dist);
        dist = dist * 180/Math.PI;
        dist = dist * 60 * 1.1515;
        if (unit==="K") { dist = dist * 1.609344 }
        if (unit==="N") { dist = dist * 0.8684 }
        return dist;
      }
    }
    var stationLat=this.state.lan;
    var stationLot=this.state.lot;
   

     fetch('https://rata.digitraffic.fi/api/v1/train-locations/latest/' + train)
    .then((response) => response.json())
    .then((responseJson) => {

            var response=JSON.stringify(responseJson);
            //empty
            if(response.length===2) 
                 alert("Junasta ei tietoja")
            else {
                 var trainLat=responseJson[0].location.coordinates[1]
                 var trainLot=responseJson[0].location.coordinates[0]
                 var dist=distance(trainLat, trainLot, stationLat, stationLot, "K");
                 dist=Math.round(dist)
               
                 alert("Junan etäisyys=" + dist  + " km")
               

                   
            }
          
    });
  }
  async open(element) {



     
    this.setState({ code:    element.stationShortCode });
    this.setState({ lot:    element.longitude });
    this.setState({ lan:    element.latitude });

    var t = this;

    await fetch('https://rata.digitraffic.fi/api/v1/live-trains/station/' + element.stationShortCode + '?arrived_trains=10&arriving_trains=10&departed_trains=10&departing_trains=10&include_nonstopping=false')
      .then((response) => response.json())
      .then((responseJson) => {


        var test2 = []

        responseJson.forEach(element => {


          if (element.trainCategory === "Long-distance" || element.trainCategory === "Commuter") {
       
        
            element.timeTableRows.forEach(stops => {
              if (stops.stationShortCode === this.state.code  && stops.type==="DEPARTURE")   {

               var dep= new Date(stops.scheduledTime)
               var minutes=dep.getMinutes();
               if(minutes<10)
                   minutes='0' + minutes;

              var target=t.state.longName[element.timeTableRows[element.timeTableRows.length-1].stationShortCode]

             //  alert(dep.getHours() + ":" + dep.getMinutes())
               if(new Date(Date.now()).getDate()===dep.getDate())  {
               test2.push(<tr key="1">
               <td  key="1"><button  onClick={()=>{ this.calculate(element.trainNumber)}} key="1">info</button></td>
               <td  key="1">{element.trainType + " " + element.trainNumber}</td><td xs="2">{  dep.getHours() + ":" + minutes}</td>

               <td xs="2">{  target}</td>
             </tr>);
              }
 
              }

               

            });
          }



        });

        //  alert(JSON.stringify(responseJson[0].timeTableRows[responseJson[0].timeTableRows.length-1]))


        this.setState({ data: test2 });
        return responseJson;
      })
      .catch((error) => {
        console.error(error);
      });


    this.setState({ open: true });
    this.setState({ stationName: element.stationName });



  }


  onCloseModal = () => {
    this.setState({ open: false });
  };


  test = [];
  async  componentWillMount() {
    let stations = await fetch('https://rata.digitraffic.fi/api/v1/metadata/stations')
      .then((response) => response.json())
      .then((responseJson) => {
   
        return responseJson;
      })
      .catch((error) => {
        console.error(error);
      });

    var stations1 = [];
    var t = this;


    var data=[];
    stations.forEach(function (element) {
      //only passangerstations

      if (element.passengerTraffic) {
        data[element.stationShortCode]=element.stationName
        stations1.push(<Marker key="1" position={[element.latitude, element.longitude]} onClick={() => t.open(element)}></Marker>);



      }





    });
    this.setState({longName: data})






    this.setState({ stations: stations1 })



  }
  render() {
    const { open } = this.state;
    return (<div>
      <Modal open={open} onClose={this.onCloseModal} center>
        <h2>Aseman {this.state.stationName} tiedot</h2>
          <table>       
              {this.state.data}
          </table>
 
      </Modal>
      {this.state.stations}
    </div>);
  }
}
const MapContainer = styled(Map)`
    width: 80%;
    height: 100vh;
    position:absolute;
    top:0px;
    left:15px;
`;


// Ugly hack to fix Leaflet icons with leaflet loaders
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});



function App() {

  const position = [65, 26];
  const map = (
      <div>
      
    <MapContainer center={position} zoom={6}>
   
      <TileLayer
        url='https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        subdomains='abcd'
        maxZoom={19}

      />

      <Stations />



    </MapContainer>
    </div>

  );


  return (
    <div>
    <p>Kulkutiedot by digitraffic</p>


    <div className="App">


      {map}
      
    </div>
    </div>
  );


}

export default App;