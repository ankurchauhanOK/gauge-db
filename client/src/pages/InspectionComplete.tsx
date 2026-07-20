import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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
  const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="flex items-center justify-center h-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="max-w-md w-full text-center space-y-8"
      >
        {/* Status icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.1 }}
          className={`w-28 h-28 rounded-full flex items-center justify-center mx-auto ${
            isAccepted ? 'bg-status-pass/10' : 'bg-status-fail/10'
          }`}
        >
          {isAccepted ? (
            <svg className="w-12 h-12 text-status-pass" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <polyline points="20,6 9,17 4,12" />
            </svg>
          ) : (
            <svg className="w-12 h-12 text-status-fail" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
        </motion.div>

        {/* Result */}
        <div>
          <h1 className={`font-heading font-bold text-title ${isAccepted ? 'text-status-pass' : 'text-status-fail'}`}>
            {isAccepted ? 'Component Accepted' : 'Component Rejected'}
          </h1>
          <p className="font-body text-body text-text-secondary mt-2">
            {isAccepted
              ? 'All inspections passed successfully'
              : 'One or more inspections failed'}
          </p>
        </div>

        {/* Details */}
        <div className="bg-surface rounded-3xl p-6 shadow-card space-y-3 text-left">
          <div className="flex justify-between py-1">
            <span className="font-body text-small text-text-secondary">Serial Number</span>
            <span className="font-mono text-body font-medium text-text-primary">{serial}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="font-body text-small text-text-secondary">Date</span>
            <span className="font-body text-small text-text-primary">{dateStr}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="font-body text-small text-text-secondary">Time</span>
            <span className="font-body text-small text-text-primary">{timeStr}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="font-body text-small text-text-secondary">Final Status</span>
            <span className={`font-heading font-semibold text-body ${isAccepted ? 'text-status-pass' : 'text-status-fail'}`}>
              {isAccepted ? 'ACCEPTED' : 'REJECTED'}
            </span>
          </div>
          {!isAccepted && (
            <div className="border-t border-border-light pt-3 mt-3">
              <span className="font-body text-small text-text-secondary">Rejection Reason</span>
              <p className="font-body text-small text-status-fail mt-1">Dimension Out of Tolerance — see inspection history for details</p>
            </div>
          )}
          {isAccepted && (
            <div className="border-t border-border-light pt-3 mt-3">
              <span className="font-body text-small text-text-secondary">QR Marking</span>
              <p className="font-body text-small text-status-warning mt-1">Ready for QR code marking</p>
            </div>
          )}
        </div>

        {/* Countdown */}
        <div className="space-y-3">
          <p className="font-body text-small text-text-secondary">Returning to dashboard in</p>
          <p className="font-heading font-bold text-display text-text-primary">{countdown}s</p>
          <div className="w-full bg-neutral-100 rounded-full h-1 max-w-xs mx-auto overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${isAccepted ? 'bg-status-pass' : 'bg-status-fail'}`}
              initial={{ width: '0%' }}
              animate={{ width: `${((5 - countdown) / 5) * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>
        </div>

        <button
          onClick={() => navigate('/operator/dashboard')}
          className="btn-primary"
        >
          Return Now
        </button>
      </motion.div>
    </div>
  );
}
