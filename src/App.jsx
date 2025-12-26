export default function App() {
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mx-auto max-w-md rounded-2xl border border-gray-200 p-4 shadow">
        <div className="text-xs tracking-wide text-gray-500">LEO</div>
        <div className="text-2xl font-semibold tracking-tight">Tailwind OK ✅</div>
        <p className="mt-2 text-sm text-gray-600">
          Si tu vois une carte propre avec un bouton noir, c’est bon.
        </p>
        <button className="mt-4 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white">
          Continuer
        </button>
      </div>
    </div>
  );
}
