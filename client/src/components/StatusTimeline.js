import { Clock, CheckSquare, MessageSquare, User, ArrowRight } from 'lucide-react';

export default function StatusTimeline({ logs = [] }) {
  if (!logs || logs.length === 0) {
    return <p className="text-slate-500 font-mono text-xs">No status logs recorded.</p>;
  }

  return (
    <div className="flow-root font-sans">
      <ul role="list" className="-mb-8">
        {logs.map((log, logIdx) => {
          const isLatest = logIdx === logs.length - 1;
          const dateStr = new Date(log.timestamp).toLocaleString();
          
          return (
            <li key={log.id || logIdx}>
              <div className="relative pb-8">
                {/* Connector line */}
                {logIdx !== logs.length - 1 && (
                  <span
                    className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-slate-800"
                    aria-hidden="true"
                  />
                )}
                
                <div className="relative flex space-x-3">
                  <div>
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-slate-950 ${
                      isLatest ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-slate-905 text-slate-400 border border-slate-800'
                    }`}>
                      {log.new_status === 'Submitted' ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <div className="text-xs text-slate-300 font-semibold flex items-center gap-1.5 flex-wrap">
                        {log.previous_status ? (
                          <span className="flex items-center gap-1">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-400 font-mono font-normal">
                              {log.previous_status}
                            </span>
                            <ArrowRight className="h-3 w-3 text-slate-500" />
                          </span>
                        ) : null}
                        
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                          log.new_status === 'Resolved' || log.new_status === 'Closed'
                            ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-900/30'
                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-900/30'
                        }`}>
                          {log.new_status}
                        </span>

                        <span className="text-slate-400 font-normal">by</span>

                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-teal-400">
                          <User className="h-3 w-3" />
                          {log.changed_by?.name || 'User'} ({log.changed_by?.role || 'student'})
                        </span>
                      </div>
                      
                      {log.comment && (
                        <div className="mt-2 text-xs text-slate-400 bg-slate-900/60 border border-slate-800/80 p-2.5 rounded-lg font-mono flex items-start gap-2 max-w-lg">
                          <MessageSquare className="h-3.5 w-3.5 text-slate-500 mt-0.5 shrink-0" />
                          <span>{log.comment}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right text-[10px] whitespace-nowrap text-slate-500 font-mono pt-1">
                      {dateStr}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
