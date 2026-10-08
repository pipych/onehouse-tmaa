import OneLaunchContent from '../components/OneLaunch';

export default function OneLaunchView() {
  return (
    <div className="min-h-screen bg-[#090b0e] text-white p-4 pt-6 md:pt-14 pb-28 antialiased">
      <div className="w-full max-w-4xl mx-auto flex flex-col">
        <OneLaunchContent />
      </div>
    </div>
  );
}
