import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';

export default function InspectionComplete() {
  const { serial } = useParams<{ serial: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const status = searchParams.get('status') || 'accepted';
  const isAccepted = status === 'accepted';

  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/operator/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const dateStr = now.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="p-6 h-full flex items-center justify-center">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Status icon */}
        <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto ${
          isAccepted ? 'bg-gauge-green/10' : 'bg-gauge-red/10'
        }`}>
          <span className={`text-6xl ${isAccepted ? 'text-gauge-green' : 'text-gauge-red'}`}>
            {isAccepted ? '✓' : '✕'}
          </span>
        </div>

        {/* Result */}
        <div>
          <h1 className={`text-4xl font-bold ${isAccepted ? 'text-gauge-green' : 'text-gauge-red'}`}>
            {isAccepted ? 'Component Accepted' : 'Component Rejected'}
          </h1>
          <p className="text-surface-400 mt-2">
            {isAccepted
              ? 'All inspections passed successfully'
              : 'One or more inspections failed'}
          </p>
        </div>

        {/* Details */}
        <div className="card space-y-3 text-left">
          <div className="flex justify-between">
            <span className="text-surface-400 text-sm">Serial Number</span>
            <span className="font-mono text-surface-200 font-medium">{serial}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-400 text-sm">Date</span>
            <span className="text-surface-200 text-sm">{dateStr}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-400 text-sm">Time</span>
            <span className="text-surface-200 text-sm">{timeStr}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-surface-400 text-sm">Final Status</span>
            <span className={`font-bold ${isAccepted ? 'text-gauge-green' : 'text-gauge-red'}`}>
              {isAccepted ? 'ACCEPTED' : 'REJECTED'}
            </span>
          </div>
          {!isAccepted && (
            <div className="border-t border-surface-700 pt-3 mt-3">
              <span className="text-surface-400 text-sm">Rejection Reason</span>
              <p className="text-gauge-red text-sm mt-1">Dimension Out of Tolerance — see inspection history for details</p>
            </div>
          )}
          {isAccepted && (
            <div className="border-t border-surface-700 pt-3 mt-3">
              <span className="text-surface-400 text-sm">QR Marking</span>
              <p className="text-gauge-amber text-sm mt-1">Ready for QR code marking</p>
            </div>
          )}
        </div>

        {/* Countdown */}
        <div className="space-y-3">
          <p className="text-surface-500 text-sm">Returning to dashboard in</p>
          <p className="text-gauge-2xl font-bold text-white">{countdown}s</p>
          <div className="w-full bg-surface-700 rounded-full h-2 max-w-xs mx-auto">
            <div
              className={`h-2 rounded-full transition-all duration-1000 ease-linear ${
                isAccepted ? 'bg-gauge-green' : 'bg-gauge-red'
              }`}
              style={{ width: `${((5 - countdown) / 5) * 100}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => navigate('/operator/dashboard')}
          className="btn-primary px-12"
        >
          Return Now
        </button>
      </div>
    </div>
  );
}
