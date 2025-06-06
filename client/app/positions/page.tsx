"use client"
import { positionRoute } from '@/utils/routeProvider';
import { PositionType } from '@/utils/TypesProvider';
import axios from 'axios';
import React, { useEffect, useState } from 'react'

const page = () => {

  const [positions, setPosition] = useState<PositionType[]>([]);

  useEffect(() => {

    fetchPositons();

  }, [])

  async function fetchPositons() {

    const response = await axios.get(positionRoute);
    if (response.data.status) {
      setPosition(response.data.positions);
    }

  }

  return (
    <div>
      {
        positions.map(position => (
          <div className=' w-[500px]' key={position.securityId}>
            <div className="bg-white shadow-xl rounded-2xl p-4 w-full">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-800">{position.tradingSymbol}</span>
                <p className={position.positionType === "LONG" ? "bg-green-100 text-green-700" : position.positionType === "SHORT" ? "bg-red-100 text-red-700" : "bg-gray-200 text-gray-700"}>
                  {position.positionType}
                </p>
              </div>
              <p className="text-xs text-gray-500">{position.drvOptionType} | {position.drvStrikePrice} | Exp: {position.drvExpiryDate.split("T")[0]}</p>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="text-xs">
                  <p className="text-gray-400">Qty</p>
                  <p className="font-semibold">{position.buyQty} / {position.sellQty} ({position.netQty})</p>
                </div>
                <div className="text-xs">
                  <p className="text-gray-400">Avg Buy/Sell</p>
                  <p className="font-semibold">{position.buyAvg} / {position.sellAvg}</p>
                </div>
                <div className="text-xs">
                  <p className="text-gray-400">Realized</p>
                  <p className={`font-semibold ${position.realizedProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ₹{position.realizedProfit.toFixed(2)}
                  </p>
                </div>
                <div className="text-xs">
                  <p className="text-gray-400">Unrealized</p>
                  <p className={`font-semibold ${position.unrealizedProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                    ₹{position.unrealizedProfit.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))
      }
    </div>

  )
}

export default page