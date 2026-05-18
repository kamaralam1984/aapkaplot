import type { TemplateVariant } from "@/lib/seo/template-router";
import type { SeoTemplateProps } from "./types";
import OverviewMapTemplate from "./OverviewMapTemplate";
import BuyingGuideTemplate from "./BuyingGuideTemplate";
import PriceDashboardTemplate from "./PriceDashboardTemplate";
import ComparisonTemplate from "./ComparisonTemplate";
import InvestmentOutlookTemplate from "./InvestmentOutlookTemplate";
import KnowledgeFaqTemplate from "./KnowledgeFaqTemplate";

const REGISTRY: Record<TemplateVariant, React.ComponentType<SeoTemplateProps>> = {
  "overview-map": OverviewMapTemplate,
  "buying-guide": BuyingGuideTemplate,
  "price-dashboard": PriceDashboardTemplate,
  "comparison": ComparisonTemplate,
  "investment-outlook": InvestmentOutlookTemplate,
  "knowledge-faq": KnowledgeFaqTemplate,
};

export function RenderSeoTemplate(props: SeoTemplateProps & { variant: TemplateVariant }) {
  const Component = REGISTRY[props.variant] ?? OverviewMapTemplate;
  return <Component {...props} />;
}
