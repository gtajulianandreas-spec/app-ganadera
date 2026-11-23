export interface GpsCoordinateResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number | null;
  timestamp: number;
}

export interface FarmGeofenceValidation {
  isValid: boolean;
  distanceMeters: number;
  statusText: string;
  badgeColor: string;
  isWithinPerimeter: boolean;
}

export class GpsService {
  /**
   * Captures the current device GPS position using HTML5 Geolocation with high accuracy.
   */
  static async getCurrentLocation(): Promise<GpsCoordinateResult> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('La geolocalización GPS no está soportada en este navegador o dispositivo.'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: Number(position.coords.latitude.toFixed(6)),
            longitude: Number(position.coords.longitude.toFixed(6)),
            accuracy: Math.round(position.coords.accuracy),
            altitude: position.coords.altitude ? Math.round(position.coords.altitude) : null,
            timestamp: position.timestamp
          });
        },
        (error) => {
          let message = 'No se pudo obtener la ubicación GPS.';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = 'Permiso GPS denegado por el usuario en el navegador.';
              break;
            case error.POSITION_UNAVAILABLE:
              message = 'Señal GPS no disponible o débil en esta ubicación.';
              break;
            case error.TIMEOUT:
              message = 'Tiempo de espera agotado al buscar satélites GPS.';
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000
        }
      );
    });
  }

  /**
   * Calculates distance in meters between two coordinates using the Haversine formula.
   */
  static calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }

  /**
   * Validates if a recorded GPS point is within the expected perimeter of the farm.
   * If no farm coordinates are configured, defaults to valid with calibration prompt.
   */
  static validateAgainstFarm(
    coord: { latitude: number; longitude: number; accuracy?: number },
    farmCoord?: { latitude?: number; longitude?: number; radiusMeters?: number }
  ): FarmGeofenceValidation {
    if (!farmCoord || farmCoord.latitude === undefined || farmCoord.longitude === undefined) {
      return {
        isValid: true,
        distanceMeters: 0,
        statusText: `GPS Registrado (±${coord.accuracy || 5}m de precisión)`,
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        isWithinPerimeter: true
      };
    }

    const maxRadius = farmCoord.radiusMeters || 3000; // Default 3km boundary
    const distance = this.calculateDistanceMeters(
      coord.latitude,
      coord.longitude,
      farmCoord.latitude,
      farmCoord.longitude
    );

    const isInside = distance <= maxRadius;

    if (isInside) {
      return {
        isValid: true,
        distanceMeters: distance,
        statusText: `Validado en potrero (a ${distance < 1000 ? `${distance}m` : `${(distance/1000).toFixed(1)}km`} del casco)`,
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        isWithinPerimeter: true
      };
    } else {
      return {
        isValid: false,
        distanceMeters: distance,
        statusText: `Alerta: Fuera de perímetro (${(distance/1000).toFixed(1)}km de la finca)`,
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        isWithinPerimeter: false
      };
    }
  }

  /**
   * Generates a Google Maps link for easy navigation to the animal/potrero location.
   */
  static getGoogleMapsUrl(latitude: number, longitude: number): string {
    return `https://www.google.com/maps?q=${latitude},${longitude}`;
  }
}
