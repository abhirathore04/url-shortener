// src/components/CustomDomainManager.tsx
export default function CustomDomainManager() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Custom Domains</h2>
      
      {/* Add Domain */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl">
        <input 
          placeholder="yourbrand.com"
          className="w-full p-3 rounded-lg border-2 border-purple-200"
        />
        <button className="mt-3 btn-primary">Add Domain</button>
      </div>
      
      {/* Domain List */}
      <DomainList domains={userDomains} />
    </div>
  );
}
