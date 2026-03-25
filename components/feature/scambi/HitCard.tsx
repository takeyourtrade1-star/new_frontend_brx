'use client';

import Image from 'next/image';

export type HitCardData = {
  name: string;
  action: string;
  item: string;
  condition: string;
  details: string;
  image: string;
  gradient: string;
};

type HitCardProps = HitCardData & {
  offset?: number;
  vIndex?: number;
  isActive?: boolean;
};

export function HitCard({ name, action, item, condition, details, image, gradient, isActive }: HitCardProps) {
  return (
    <div className={`hit-card ${isActive ? 'hit-card-active' : ''}`} style={{ background: gradient }}>
      <div className="hit-card-content">
        <div className="hit-card-left">
          <h3 className="hit-card-title">{name}</h3>
          <p className="hit-card-item-name">{item}</p>
          <div className="hit-card-bottom-info">
            <p className="hit-card-condition-text">{condition}</p>
            <p className="hit-card-details-text">{details}</p>
          </div>
        </div>
        <div className="hit-card-right">
          <div className="hit-card-img-box">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="hit-card-actual-img" />
          </div>
        </div>
      </div>
      <span className="hit-card-badge">{action}</span>
    </div>
  );
}
