import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

interface RoutingMachineProps {
  source: [number, number];
  destination: [number, number];
}

export default function RoutingMachine({ source, destination }: RoutingMachineProps) {
  const map = useMap();

  useEffect(() => {
    if (!source || !destination || !map) return;

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(source[0], source[1]),
        L.latLng(destination[0], destination[1])
      ],
      routeWhileDragging: true,
      showAlternatives: true,
      fitSelectedRoutes: true,
      lineOptions: {
        styles: [{ color: '#3b82f6', weight: 4, opacity: 0.9, className: 'traffic-line-animated' }],
        extendToWaypoints: true,
        missingRouteTolerance: 0
      },
      show: true // Make sure the itinerary is shown
    }).addTo(map);

    return () => {
      try {
        if (map && routingControl) {
          map.removeControl(routingControl);
        }
      } catch (e) {
        console.error("Error removing routing control", e);
      }
    };
  }, [map, source, destination]);

  return null;
}
