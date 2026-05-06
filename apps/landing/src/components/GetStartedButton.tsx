import amplitude from '../lib/amplitude';

const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:4001';

interface Props {
  className?: string;
  children: React.ReactNode;
  source?: string;
  planName?: string;
}

const GetStartedButton = ({
  className,
  children,
  source = 'hero',
  planName,
}: Props) => {
  const handleClick = () => {
    amplitude.track('Get Started Clicked', {
      source,
      ...(planName ? { plan_name: planName } : {}),
    });
  };

  return (
    <a href={APP_URL} onClick={handleClick} className={className}>
      {children}
    </a>
  );
};

export default GetStartedButton;
