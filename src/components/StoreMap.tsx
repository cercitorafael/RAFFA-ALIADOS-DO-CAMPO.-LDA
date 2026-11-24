import React, { useState, useCallback } from 'react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  APILoadingStatus,
} from '@vis.gl/react-google-maps';
import { MapPin, Navigation, Clock, Phone, AlertTriangle, ExternalLink } from 'lucide-react';
import { COMPANY_INFO } from '../data/agroData';

const STORE_COORDINATES = {
  lat: COMPANY_INFO.coordinates.lat,
  lng: COMPANY_INFO.coordinates.lng,
};

const DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${STORE_COORDINATES.lat},${STORE_COORDINATES.lng}`;
const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const StoreMarkerWithInfoWindow: React.FC = () => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoOpen, setInfoOpen] = useState(true);

  const handleMarkerClick = useCallback(() => {
    setInfoOpen((prev) => !prev);
  }, []);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={STORE_COORDINATES}
        onClick={handleMarkerClick}
        title={COMPANY_INFO.name}
      >
        <Pin
          background="#047857"
          borderColor="#064e3b"
          glyphColor="#fde68a"
          scale={1.25}
        />
      </AdvancedMarker>

      {infoOpen && marker && (
        <InfoWindow
          anchor={marker}
          maxWidth={270}
          onCloseClick={() => setInfoOpen(false)}
        >
          <div className="p-1 text-stone-900 space-y-1.5">
            <div className="font-extrabold text-sm text-emerald-900">
              {COMPANY_INFO.name}
            </div>
            <div className="text-xs text-stone-600">
              {COMPANY_INFO.location}, {COMPANY_INFO.province}
            </div>
            <div className="text-[11px] text-stone-500">
              {COMPANY_INFO.openingHours}
            </div>
            <a
              href={DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 underline pt-1"
            >
              <span>Abrir Rota GPS</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </InfoWindow>
      )}
    </>
  );
};

const MapContentWithStatus: React.FC = () => {
  const status = useApiLoadingStatus();

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-stone-100 p-6 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-amber-600" />
        <div className="text-sm font-bold text-stone-800">
          Não foi possível carregar o mapa interativo neste momento
        </div>
        <p className="text-xs text-stone-600 max-w-md">
          Verifique a sua ligação à internet ou abra diretamente as direções GPS para Namiconha - Ribaué.
        </p>
        <a
          href={DIRECTIONS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Como Chegar (Google Maps GPS)</span>
        </a>
      </div>
    );
  }

  return (
    <GoogleMap
      mapId="DEMO_MAP_ID"
      defaultCenter={STORE_COORDINATES}
      defaultZoom={14}
      gestureHandling="cooperative"
      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
      style={{ width: '100%', height: '100%' }}
    >
      <StoreMarkerWithInfoWindow />
    </GoogleMap>
  );
};

export const StoreMap: React.FC = () => {
  return (
    <div className="bg-stone-50 border border-stone-200 rounded-3xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 bg-white border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-stone-900 font-['Outfit']">
              Localização da Loja em {COMPANY_INFO.location}
            </h3>
            <p className="text-xs text-stone-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{COMPANY_INFO.openingHours}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`tel:${COMPANY_INFO.phoneFull}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors"
          >
            <Phone className="w-3.5 h-3.5 text-emerald-700" />
            <span>{COMPANY_INFO.phone}</span>
          </a>
          <a
            id="store-map-directions-btn"
            href={DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Como Chegar (GPS)</span>
          </a>
        </div>
      </div>

      {/* Explicit sized container (CF2) */}
      <div className="h-[340px] sm:h-[400px] w-full relative bg-stone-100">
        {MAPS_API_KEY ? (
          <APIProvider
            apiKey={MAPS_API_KEY}
            libraries={['marker']}
            language="pt"
            region="MZ"
          >
            <MapContentWithStatus />
          </APIProvider>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-stone-900 text-base font-['Outfit']">
                {COMPANY_INFO.name} — {COMPANY_INFO.location}
              </h4>
              <p className="text-xs text-stone-600 mt-1">
                Coordenadas GPS: {STORE_COORDINATES.lat}, {STORE_COORDINATES.lng} • {COMPANY_INFO.province}
              </p>
            </div>
            <a
              href={DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              <Navigation className="w-4 h-4" />
              <span>Abrir Rota no Google Maps</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
