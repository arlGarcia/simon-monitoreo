'use client';

import styles from './AlertsPanel.module.css';

const alertIcons = {
  LOW_FUEL: '⛽',
};

function AlertItem({ alert }) {
  return (
    <div className={styles.alertItem}>
      <span className={styles.alertIcon}>{alertIcons[alert.type] ?? '⚠️'}</span>
      <div className={styles.alertBody}>
        <p className={styles.alertMessage}>{alert.message}</p>
        <span className={styles.alertMeta}>
          {alert.vehicle_id} · {new Date(alert.created_at).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

export function AlertsPanel({ alerts }) {
  return (
    <section className={styles.panel}>
      <h3 className={styles.title}>
        <span>🔔</span> Predictive Alerts
        {alerts.length > 0 && <span className={styles.badge}>{alerts.length}</span>}
      </h3>
      <div className={styles.list}>
        {alerts.length === 0 && (
          <p className={styles.empty}>No active alerts</p>
        )}
        {alerts.map((a, idx) => {
          const key = a.id || a.ID ? `${a.id || a.ID}-${idx}` : `alert-${idx}`;
          return <AlertItem key={key} alert={a} />;
        })}
      </div>
    </section>
  );
}
