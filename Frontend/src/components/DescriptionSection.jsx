import React from 'react';
import { Drop, Sparkle, ThermometerSimple, Waves, ShieldCheck, Info } from '@phosphor-icons/react';

const DescriptionSection = ({ isProduct = true, description, data }) => {
  const careInstructions = [
    {
      icon: <Waves size={20} weight="light" className="text-Primarycolor" />,
      title: "Machine Wash Cold",
      desc: "Wash inside out with like colors on a gentle cycle using mild detergent."
    },
    {
      icon: <ThermometerSimple size={20} weight="light" className="text-Primarycolor" />,
      title: "Do Not Tumble Dry",
      desc: "Hang dry or lay flat in the shade to preserve garment shape, elastic, and embroidery."
    },
    {
      icon: <Sparkle size={20} weight="light" className="text-Primarycolor" />,
      title: "Low Heat Ironing",
      desc: "Cool iron on reverse side if needed. Do not iron directly over embroidery or prints."
    },
    {
      icon: <Drop size={20} weight="light" className="text-Primarycolor" />,
      title: "No Bleach",
      desc: "Avoid using chlorine bleach or harsh chemical stain removers to protect color vibrancy."
    }
  ];

  return (
    <div className="bg-Secondarycolor font-display space-y-12">
      {/* Product / Bundle Details */}
      <div className="bg-surface rounded-sm border border-border p-6 sm:p-8 lg:p-10">
        <div className="flex items-center gap-2 mb-4">
          <Info size={20} weight="light" className="text-Primarycolor" />
          <h3 className="text-lg sm:text-xl font-display font-semibold text-Primarycolor tracking-tight">
            {isProduct ? 'Product Description & Details' : 'Bundle Details'}
          </h3>
        </div>

        <div className="text-sm text-text-secondary leading-relaxed space-y-4 max-w-3xl font-normal">
          {description ? (
            <p className="whitespace-pre-line">{description}</p>
          ) : (
            <p>
              Crafted from high-grade, breathable fabric engineered for maximum comfort, durability, and a clean silhouette. Designed with precision stitching and tailored fit for effortless streetwear sophistication.
            </p>
          )}
        </div>

        {!isProduct && data?.items && data.items.length > 0 && (
          <div className="mt-6 p-5 bg-Secondarycolor border border-border rounded-sm max-w-xl">
            <h4 className="text-xs font-display font-semibold uppercase tracking-[0.1em] text-Primarycolor mb-3">
              Bundle Package Includes:
            </h4>
            <ul className="space-y-2">
              {data.items.map((item, index) => (
                <li key={index} className="flex items-center gap-2.5 text-xs text-text-secondary font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-Primarycolor flex-shrink-0" />
                  <span>{item.product_name || item.name || `Bundle Item ${index + 1}`}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* General Garment Care Instructions Section */}
      <div className="bg-surface rounded-sm border border-border p-6 sm:p-8 lg:p-10">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border-subtle">
          <div>
            <span className="text-[0.7rem] uppercase tracking-[0.15em] text-text-tertiary font-medium block mb-1">
              Garment Maintenance
            </span>
            <h3 className="text-lg sm:text-xl font-display font-semibold text-Primarycolor tracking-tight">
              Product Care Instructions
            </h3>
          </div>
          <ShieldCheck size={24} weight="light" className="text-Primarycolor hidden sm:block" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {careInstructions.map((item, index) => (
            <div
              key={index}
              className="p-5 bg-Secondarycolor/60 border border-border/60 rounded-sm hover:border-border transition-colors duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center mb-4">
                  {item.icon}
                </div>
                <h4 className="text-sm font-display font-medium text-Primarycolor mb-1.5">
                  {item.title}
                </h4>
                <p className="text-xs text-text-tertiary leading-normal">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DescriptionSection;