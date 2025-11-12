import { Leaf } from 'lucide-react'

function Footer() {
  return (
    <footer className="mt-20 border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* CMU ShareCycle Info */}
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white shadow-md">
                <Leaf size={24} />
              </div>
              <div>
                <p className="text-lg font-bold text-primary">CMU ShareCycle</p>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Green Campus Initiative
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">
              Share More, Waste Less. Building a sustainable campus community together.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <p className="mb-4 text-base font-bold text-gray-900">Quick Links</p>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>
                <a href="/" className="hover:text-primary transition-colors">
                  About ShareCycle
                </a>
              </li>
              <li>
                <a href="/" className="hover:text-primary transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="/" className="hover:text-primary transition-colors">
                  Campus Guidelines
                </a>
              </li>
              <li>
                <a href="/" className="hover:text-primary transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* SDG Goals */}
          <div>
            <p className="mb-4 text-base font-bold text-gray-900">Supporting SDG Goals</p>
            <div className="mb-3 flex gap-2">
              <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
                SDG 11
              </span>
              <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary">
                SDG 12
              </span>
            </div>
            <p className="mb-4 text-xs text-gray-600">
              Sustainable Cities & Responsible Consumption
            </p>
            <p className="text-xs text-gray-500">
              Made with ❤️ for Chiang Mai University
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 border-t border-gray-200 pt-6">
          <p className="text-xs text-gray-500">
            Do not sell or share my personal info
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

