import { LatLngTuple } from 'leaflet';

export interface GraphNode {
  coords: LatLngTuple;
  neighbors: Record<string, number>;
}

// Intersections in Gandhinagar sector / SG Highway
const trafficGraphDefinition: Record<string, GraphNode> = {
  'Kudasan-Cross': { coords: [23.1885, 72.6285], neighbors: { 'Sargasan-Cross': 2.5, 'Infocity': 1.8, 'PDEU-Road': 2.1, 'Bhaijipura': 3.0 } },
  'Sargasan-Cross': { coords: [23.1855, 72.6085], neighbors: { 'Kudasan-Cross': 2.5, 'CH-3': 4.2 } },
  'GIFT-City': { coords: [23.1610, 72.6840], neighbors: { 'Bhaijipura': 4.5, 'PDEU-Road': 6.0 } },
  'PDEU-Road': { coords: [23.1670, 72.6360], neighbors: { 'Kudasan-Cross': 2.1, 'GIFT-City': 6.0, 'Randesan': 1.5 } },
  'Infocity': { coords: [23.1930, 72.6460], neighbors: { 'Kudasan-Cross': 1.8, 'Sector-11': 2.5, 'CH-3': 3.0 } },
  'Sector-11': { coords: [23.2140, 72.6500], neighbors: { 'Infocity': 2.5, 'GH-5': 1.5, 'Pathika-Ashram': 2.0 } },
  'Pathika-Ashram': { coords: [23.2180, 72.6540], neighbors: { 'Sector-11': 2.0, 'GH-5': 1.2, 'Sector-21': 1.8 } },
  'Vidhan-Sabha': { coords: [23.2155, 72.6640], neighbors: { 'GH-5': 0.8, 'Sector-21': 2.5 } },
  'GH-5': { coords: [23.2185, 72.6631], neighbors: { 'Sector-11': 1.5, 'Pathika-Ashram': 1.2, 'Vidhan-Sabha': 0.8 } },
  'CH-3': { coords: [23.2135, 72.6450], neighbors: { 'Sargasan-Cross': 4.2, 'Infocity': 3.0, 'Sector-1': 3.5 } },
  'Sector-1': { coords: [23.2382, 72.6394], neighbors: { 'CH-3': 3.5, 'Sector-21': 4.0 } },
  'Sector-21': { coords: [23.2307, 72.6534], neighbors: { 'Pathika-Ashram': 1.8, 'Vidhan-Sabha': 2.5, 'Sector-1': 4.0, 'Sector-30': 3.2 } },
  'Sector-30': { coords: [23.2505, 72.6713], neighbors: { 'Sector-21': 3.2, 'Pethapur': 2.5 } },
  'Pethapur': { coords: [23.2685, 72.6520], neighbors: { 'Sector-30': 2.5 } },
  'Randesan': { coords: [23.1765, 72.6330], neighbors: { 'PDEU-Road': 1.5, 'Bhaijipura': 3.5 } },
  'Bhaijipura': { coords: [23.1812, 72.6541], neighbors: { 'Kudasan-Cross': 3.0, 'GIFT-City': 4.5, 'Randesan': 3.5 } }
};

export class RerouteService {
  private graph: Record<string, GraphNode>;
  
  constructor() {
    this.graph = JSON.parse(JSON.stringify(trafficGraphDefinition));
  }

  public getGraph() {
    return this.graph;
  }

  public getIntersectionName(id: string): string {
    return id.replace(/-/g, ' ');
  }

  // Severs the bidirectional edge between two nodes
  public closeRoad(from: string, to: string) {
    if (this.graph[from] && this.graph[from].neighbors[to]) {
      delete this.graph[from].neighbors[to];
    }
    if (this.graph[to] && this.graph[to].neighbors[from]) {
      delete this.graph[to].neighbors[from];
    }
  }

  // Full Dijkstra with permanent closed roads removed
  public dijkstraReroute(startId: string, endId: string, closedRoads: string[][] = []): { path: string[], distance: number, polyline: LatLngTuple[] } | null {
    // If we want dynamic closure on top of permanent:
    for (const [from, to] of closedRoads) {
      this.closeRoad(from, to);
    }

    const distances: Record<string, number> = {};
    const previous: Record<string, string | null> = {};
    const queue = new Set<string>();

    for (const node in this.graph) {
      distances[node] = Infinity;
      previous[node] = null;
      queue.add(node);
    }
    distances[startId] = 0;

    let current: string | null = null;

    while (queue.size > 0) {
      let minDistance = Infinity;
      let minNode: string | null = null;

      for (const node of queue) {
        if (distances[node] < minDistance) {
          minDistance = distances[node];
          minNode = node;
        }
      }

      if (minNode === null || minNode === endId) {
        break;
      }

      queue.delete(minNode);
      current = minNode;

      const neighbors = this.graph[current].neighbors;
      for (const neighbor in neighbors) {
        if (!queue.has(neighbor)) continue;

        // In a real system you would add traffic multipliers here
        const alt = distances[current] + neighbors[neighbor];
        if (alt < distances[neighbor]) {
          distances[neighbor] = alt;
          previous[neighbor] = current;
        }
      }
    }

    if (distances[endId] === Infinity) {
      return null;
    }

    const path: string[] = [];
    current = endId;
    while (current !== null) {
      path.unshift(current);
      current = previous[current];
    }

    const polyline = path.map(nodeId => this.graph[nodeId].coords);

    return {
      path,
      distance: distances[endId],
      polyline
    };
  }
}

export const trafficEngine = new RerouteService();
