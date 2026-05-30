import { useState } from "react";
function CalendarView({ plan }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("en-US", { month: "long", year: "numeric" });


  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayJS = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const startOffset = (firstDayJS + 6) % 7; // Convert to 0=Mon, ..., 6=Sun

  // Build a flat array: nulls for empty leading cells, then day numbers
  const cells = [
    ...Array(startOffset).fill(null),
    ...Array(daysInMonth).fill(null).map((_, i) => i + 1),
  ]

  // Split into rows of 7
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return (
    <div className="flex items-center justify-center px-4 py-8">
{/* <!--- more free and premium Tailwind CSS components at https://tailwinduikit.com/ ---> */}

            <div className="w-full max-w-sm shadow-lg">
                <div className="p-5 bg-white rounded-t md:p-8 dark:bg-gray-800">
                    <div className="flex items-center justify-between px-4">
                        <span  tabindex="0" className="text-base font-bold text-gray-800 focus:outline-none dark:text-gray-100">{monthName}</span>
                        <div className="flex items-center">
                            <button aria-label="calendar backward" className="text-gray-800 focus:text-gray-400 hover:text-gray-400 dark:text-gray-100" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-chevron-left" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                    <polyline points="15 6 9 12 15 18" />
                                </svg>
                        </button>
                        <button aria-label="calendar forward" className="ml-3 text-gray-800 focus:text-gray-400 hover:text-gray-400 dark:text-gray-100" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}> 
                              <svg xmlns="http://www.w3.org/2000/svg" className="icon icon-tabler icon-tabler-chevron-right" width="24" height="24" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                                <polyline points="9 6 15 12 9 18" />
                            </svg>
                        </button>

                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-12 overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th>
                                        <div className="flex justify-center w-full">
                                            <p className="text-base font-medium text-center text-gray-800 dark:text-gray-100">Mo</p>
                                        </div>
                                    </th>
                                    <th>
                                        <div className="flex justify-center w-full">
                                            <p className="text-base font-medium text-center text-gray-800 dark:text-gray-100">Tu</p>
                                        </div>
                                    </th>
                                    <th>
                                        <div className="flex justify-center w-full">
                                            <p className="text-base font-medium text-center text-gray-800 dark:text-gray-100">We</p>
                                        </div>
                                    </th>
                                    <th>
                                        <div className="flex justify-center w-full">
                                            <p className="text-base font-medium text-center text-gray-800 dark:text-gray-100">Th</p>
                                        </div>
                                    </th>
                                    <th>
                                        <div className="flex justify-center w-full">
                                            <p className="text-base font-medium text-center text-gray-800 dark:text-gray-100">Fr</p>
                                        </div>
                                    </th>
                                    <th>
                                        <div className="flex justify-center w-full">
                                            <p className="text-base font-medium text-center text-gray-800 dark:text-gray-100">Sa</p>
                                        </div>
                                    </th>
                                    <th>
                                        <div className="flex justify-center w-full">
                                            <p className="text-base font-medium text-center text-gray-800 dark:text-gray-100">Su</p>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, rowindex) => (
                                    <tr key={rowindex}>
                                        {row.map((cell, cellIndex) => (
                                            <td key={cellIndex} className="pt-6">
                                                <div className="flex justify-center w-full px-2 py-2">
                                                    {cell && <p className="text-base font-medium text-gray-300 dark:text-gray-100">{cell}</p>}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="px-5 py-5 rounded-b md:py-8 md:px-16 dark:bg-gray-700 bg-gray-50">
                    <div className="px-4">
                        <div className="pb-4 border-b border-gray-400 border-dashed">
                            <p className="text-xs font-light leading-3 text-gray-500 dark:text-gray-300">9:00 AM</p>
                            <a tabIndex="0" className="mt-2 text-lg font-medium leading-5 text-gray-800 focus:outline-none dark:text-gray-100">Zoom call with design team</a>
                            <p className="pt-2 text-sm leading-none leading-4 text-gray-600 dark:text-gray-300">Discussion on UX sprint and Wireframe review</p>
                        </div>
                        <div className="pt-5 pb-4 border-b border-gray-400 border-dashed">
                            <p className="text-xs font-light leading-3 text-gray-500 dark:text-gray-300">10:00 AM</p>
                            <a tabIndex="0" className="mt-2 text-lg font-medium leading-5 text-gray-800 focus:outline-none dark:text-gray-100">Orientation session with new hires</a>
                        </div>
                        <div className="pt-5 pb-4 border-b border-gray-400 border-dashed">
                            <p className="text-xs font-light leading-3 text-gray-500 dark:text-gray-300">9:00 AM</p>
                            <a tabIndex="0" className="mt-2 text-lg font-medium leading-5 text-gray-800 focus:outline-none dark:text-gray-100">Zoom call with design team</a>
                            <p className="pt-2 text-sm leading-none leading-4 text-gray-600 dark:text-gray-300">Discussion on UX sprint and Wireframe review</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
  );
}

export default CalendarView;