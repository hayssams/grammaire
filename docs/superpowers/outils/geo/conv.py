# Convertit des GeoJSON en tracés SVG inline pour les carnets de géo.
import json, math

def anneaux(g):
    if g['type']=='Polygon': return [g['coordinates'][0]]
    if g['type']=='MultiPolygon': return [p[0] for p in g['coordinates']]
    if g['type']=='LineString': return [g['coordinates']]
    if g['type']=='MultiLineString': return list(g['coordinates'])
    return []

def dp(pts, eps):                      # Douglas-Peucker itératif
    if len(pts) < 3: return pts
    garde=[False]*len(pts); garde[0]=garde[-1]=True
    pile=[(0,len(pts)-1)]
    while pile:
        a,b=pile.pop()
        imax,dmax=0,0.0
        (x1,y1),(x2,y2)=pts[a],pts[b]
        dxb,dyb=x2-x1,y2-y1; n2=dxb*dxb+dyb*dyb
        for i in range(a+1,b):
            x,y=pts[i]
            if n2==0: dd=math.hypot(x-x1,y-y1)
            else:
                t=max(0,min(1,((x-x1)*dxb+(y-y1)*dyb)/n2))
                dd=math.hypot(x-(x1+t*dxb), y-(y1+t*dyb))
            if dd>dmax: imax,dmax=i,dd
        if dmax>eps:
            garde[imax]=True; pile.append((a,imax)); pile.append((imax,b))
    return [p for p,g in zip(pts,garde) if g]

class Cadre:
    """Projection équirectangulaire corrigée, calée sur une emprise géographique."""
    def __init__(self, lo0, lo1, la0, la1, W, H, marge=4):
        self.k=math.cos(math.radians((la0+la1)/2))
        self.lo0, self.la1 = lo0, la1
        mx=(lo1-lo0)*self.k; my=(la1-la0)
        self.e=min((W-2*marge)/mx,(H-2*marge)/my)
        self.dx=(W-mx*self.e)/2; self.dy=(H-my*self.e)/2
    def __call__(self, lon, lat):
        return ((lon-self.lo0)*self.k*self.e+self.dx, (self.la1-lat)*self.e+self.dy)

def trace(geom, cadre, eps=0.7, ferme=True, aire_min=0.0, garder=None):
    """Rend un 'd' SVG. garder=n : les n plus grands anneaux seulement."""
    parts=[]
    anns=anneaux(geom)
    anns=sorted(anns, key=len, reverse=True)
    if garder: anns=anns[:garder]
    for a in anns:
        p=[cadre(c[0],c[1]) for c in a]
        p=dp(p,eps)
        if len(p)<(3 if ferme else 2): continue
        if aire_min and ferme:
            s=abs(sum((p[j][0]+p[i][0])*(p[j][1]-p[i][1]) for i,j in
                      zip(range(len(p)), [len(p)-1]+list(range(len(p)-1))))/2)
            if s<aire_min: continue
        parts.append("M"+" L".join("%.1f %.1f"%q for q in p)+(" Z" if ferme else ""))
    return " ".join(parts)

def centre(geom, cadre):
    """Centroïde du plus grand anneau, ramené à l'écran."""
    a=max(anneaux(geom), key=len)
    pts=[cadre(c[0],c[1]) for c in a]
    n=len(pts); A=0; cx=cy=0
    for i in range(n):
        x1,y1=pts[i]; x2,y2=pts[(i+1)%n]
        f=x1*y2-x2*y1; A+=f; cx+=(x1+x2)*f; cy+=(y1+y2)*f
    if abs(A)<1e-9:
        return (sum(p[0] for p in pts)/n, sum(p[1] for p in pts)/n)
    A*=0.5
    return (cx/(6*A), cy/(6*A))

def sommets_d(d):
    """Anneaux d'un 'd' SVG fait de M/L/Z."""
    import re
    anns=[]
    for bloc in d.split("M"):
        if not bloc.strip(): continue
        pts=[(float(a),float(b)) for a,b in re.findall(r"(-?[\d.]+)\s+(-?[\d.]+)",bloc)]
        if len(pts)>=3: anns.append(pts)
    return anns

def dedans(pt, poly):
    x,y=pt; ok=False; n=len(poly)
    for i in range(n):
        j=(i-1)%n
        xi,yi=poly[i]; xj,yj=poly[j]
        if (yi>y)!=(yj>y) and x < (xj-xi)*(y-yi)/(yj-yi)+xi: ok=not ok
    return ok

def point_interieur(d, pas=1.0):
    """Point intérieur le plus loin du bord, sur le plus grand anneau."""
    anns=sommets_d(d)
    if not anns: return None
    poly=max(anns,key=len)
    xs=[p[0] for p in poly]; ys=[p[1] for p in poly]
    meilleur=None; score=-1
    y=min(ys)
    while y<=max(ys):
        x=min(xs)
        while x<=max(xs):
            if dedans((x,y),poly):
                dmin=min(min(abs(x-px),abs(y-py)) for px,py in poly)
                dd=min((abs(x-px)**2+abs(y-py)**2)**.5 for px,py in poly)
                if dd>score: score=dd; meilleur=(x,y)
            x+=pas
        y+=pas
    return meilleur
